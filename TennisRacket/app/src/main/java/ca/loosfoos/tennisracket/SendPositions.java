package ca.loosfoos.tennisracket;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.TriggerEvent;
import android.hardware.TriggerEventListener;
import android.os.Bundle;
import android.os.SystemClock;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.widget.TextView;

import java.io.BufferedWriter;
import java.io.Console;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.Socket;
import java.net.SocketAddress;
import java.net.SocketException;
import java.net.UnknownHostException;

public class SendPositions extends AppCompatActivity implements SensorEventListener {

    private SensorManager mSensorManager;
    private TriggerEventListener mTriggerEventListener;
    private Sensor gyro;
    private Sensor accelerometer;
    private Sensor magnetometer;
    private Socket socket;
    PrintWriter serverWriter;
    private boolean suspended;
    TextView rot_X;
    TextView rot_Y;
    TextView rot_Z;
    TextView acc_X;
    TextView acc_Y;
    TextView acc_Z;
    // Create a constant to convert nanoseconds to seconds.
    private static final float NS2S = 1.0f / 1000000000.0f;
    private final static double EPSILON = 0.00001;
    private final float[] deltaRotationVector = new float[4];
    private float rotationCurrent = 0;
    private float timestamp;
    private InetAddress ipAddress = null;
    DatagramSocket client_socket = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_send_positions);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        Thread thread = new Thread(new Runnable() {
        @Override
        public void run() {

            try{
                client_socket = new DatagramSocket(5000);
            } catch(SocketException e1){
                e1.printStackTrace();
            }

            try{
                ipAddress = InetAddress.getByName("192.168.5.62");
            }
            catch(UnknownHostException e2){
                e2.printStackTrace();
            }

            float oldX = 0, oldY = 0, oldZ = 0;
            float[] rotation = {0,0,0,0};


            try {
                for (;;) {
                    if (!suspended) {
                        rotation[0] = orientation[0];
                        rotation[1] = orientation[1];
                        rotation[2] = orientation[2];
                        if (oldX != rotation[0] || oldY != rotation[1] || oldZ != rotation[2]) {
                            oldX = rotation[1];
                            oldY = rotation[2];
                            oldZ = rotation[3];
                            String str = String.valueOf(rotation[0]) + "," + String.valueOf(rotation[1]) + "," + String.valueOf(rotation[2]) + "," + String.valueOf(rotation[3])
                            + "," + String.valueOf(speed[0])+ "," + String.valueOf(speed[1])+ "," + String.valueOf(speed[2]);
                            byte[] send_data = str.getBytes();

                            DatagramPacket send_packet = new DatagramPacket(send_data, str.length(), ipAddress, 5000);
                            try {
                                client_socket.send(send_packet);
                            } catch (Exception e1) {
                                e1.printStackTrace();
                            }
                        }
                    }
                    SystemClock.sleep(100);
                }
            }
            catch(Exception exp) {
                exp.printStackTrace();
            }
        }
    });

        thread.start();

        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                lastTimeMili = 0;
                speed[0] = 0;
                speed[1] = 0;
                speed[2] = 0;
            }
        });
        rot_X = (TextView) findViewById(R.id.x);
        rot_Y = (TextView) findViewById(R.id.y);
        rot_Z = (TextView) findViewById(R.id.z);

        acc_X = (TextView) findViewById(R.id.acc_x);
        acc_Y = (TextView) findViewById(R.id.acc_y);
        acc_Z = (TextView) findViewById(R.id.acc_z);

        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        gyro = mSensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION);
        accelerometer =  mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        magnetometer = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        mSensorManager.requestTriggerSensor(mTriggerEventListener, gyro);
        mSensorManager.requestTriggerSensor(mTriggerEventListener, accelerometer);
        mSensorManager.requestTriggerSensor(mTriggerEventListener, magnetometer);
    }

    @Override
    protected void onResume() {
        suspended = false;
        try{
            client_socket = new DatagramSocket(5000);
        } catch(SocketException e1){
            e1.printStackTrace();
        }
        mSensorManager.registerListener(this, gyro, SensorManager.SENSOR_DELAY_FASTEST);
        mSensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_FASTEST);
        mSensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_GAME);
        super.onResume();
    }

    @Override
    protected void onPause() {
        suspended = true;
        mSensorManager.unregisterListener(this, gyro);
        mSensorManager.unregisterListener(this, accelerometer);
        mSensorManager.unregisterListener(this, magnetometer);
        client_socket.disconnect();
        client_socket.close();
        super.onPause();
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int i){

    }

    float[] mGravity;
    float[] mGeomagnetic;
    float orientation[] = new float[3];
    float quaternion[] = new float[4];
    double[] speed = new double[3];
    double[] position = new double[3];
    long lastTimeMili = 0;
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            mGravity = event.values;
        }
        else if(event.sensor.getType() == Sensor.TYPE_LINEAR_ACCELERATION)
        {
            float acc_x =(float) (mGravity[0]*(Math.cos(orientation[2])*Math.cos(orientation[0])+Math.sin(orientation[2])*Math.sin(orientation[1])*Math.sin(orientation[0])) + mGravity[1]*(Math.cos(orientation[1])*Math.sin(orientation[0])) + mGravity[2]*(-Math.sin(orientation[2])*Math.cos(orientation[0])+Math.cos(orientation[2])*Math.sin(orientation[1])*Math.sin(orientation[0])));
            float acc_y = (float) (mGravity[0]*(-Math.cos(orientation[2])*Math.sin(orientation[0])+Math.sin(orientation[2])*Math.sin(orientation[1])*Math.cos(orientation[0])) + mGravity[1]*(Math.cos(orientation[1])*Math.cos(orientation[0])) + mGravity[2]*(Math.sin(orientation[2])*Math.sin(orientation[0])+ Math.cos(orientation[2])*Math.sin(orientation[1])*Math.cos(orientation[0])));
            float acc_z = (float) (mGravity[0]*(Math.sin(orientation[2])*Math.cos(orientation[1])) + mGravity[1]*(-Math.sin(orientation[1])) + mGravity[2]*(Math.cos(orientation[2])*Math.cos(orientation[1])));

            long curMili = System.currentTimeMillis();
            if(lastTimeMili != 0) {
                float deltaTime = ((float) (curMili - lastTimeMili)) / 1000;
                speed[0] = acc_x;
                speed[1] = acc_y;
                speed[2] = acc_z;
                acc_X.setText("X:" + String.valueOf((int) speed[0]));
                acc_Y.setText("Y:" + String.valueOf((int) speed[1]));
                acc_Z.setText("Z:" + String.valueOf((int) speed[2]));
            }
            lastTimeMili = curMili;
        }
        else if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            mGeomagnetic = event.values;
            if (mGravity != null && mGeomagnetic != null) {
                float R[] = new float[9];
                float I[] = new float[9];
                boolean success = SensorManager.getRotationMatrix(R, I, mGravity, mGeomagnetic);
                if (success) {
                    SensorManager.getOrientation(R, orientation);
                    rot_X.setText("X:" + String.valueOf((int) (orientation[1]* (180/Math.PI))));
                    rot_Y.setText("Y:" + String.valueOf((int) (orientation[2]* (180/Math.PI))));
                    rot_Z.setText("Z:" + String.valueOf((int) (orientation[0]* (180/Math.PI))));
                }
            }
        }
    }


    boolean mInitialized;
    float NOISE = (float)0.01;
    float mLastX;
    float mLastY;
    float mLastZ;
    float rotX;
    float rotY;
    float rotZ;

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_send_positions, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

}