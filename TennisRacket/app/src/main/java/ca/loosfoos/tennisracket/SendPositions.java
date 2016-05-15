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
                        rotation[0] = quaternion[0];
                        rotation[1] = quaternion[1];
                        rotation[2] = quaternion[2];
                        rotation[3] = quaternion[3];
                        if (oldX != rotation[1] || oldY != rotation[2] || oldZ != rotation[3]) {
                            oldX = rotation[1];
                            oldY = rotation[2];
                            oldZ = rotation[3];
                            String str = String.valueOf(rotation[0]) + "," + String.valueOf(rotation[1]) + "," + String.valueOf(rotation[2]) + "," + String.valueOf(rotation[3])
                            + "," + String.valueOf(mGravity[0])+ "," + String.valueOf(mGravity[1])+ "," + String.valueOf(mGravity[2]);
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
        rot_X = (TextView) findViewById(R.id.x);
        rot_Y = (TextView) findViewById(R.id.y);
        rot_Z = (TextView) findViewById(R.id.z);

        acc_X = (TextView) findViewById(R.id.acc_x);
        acc_Y = (TextView) findViewById(R.id.acc_y);
        acc_Z = (TextView) findViewById(R.id.acc_z);
        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        //gyro = mSensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        accelerometer =  mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        magnetometer = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        //mSensorManager.requestTriggerSensor(mTriggerEventListener, gyro);
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
        //mSensorManager.registerListener(this, gyro, SensorManager.SENSOR_DELAY_GAME);
        mSensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
        mSensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_GAME);
        super.onResume();
    }

    @Override
    protected void onPause() {
        suspended = true;
        //mSensorManager.unregisterListener(this, gyro);
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
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            mGravity = event.values;
            acc_X.setText("X:" + String.valueOf((int) (mGravity[0])));
            acc_Y.setText("Y:" + String.valueOf((int) (mGravity[1])));
            acc_Z.setText("Z:" + String.valueOf((int) (mGravity[2])));
        }
        if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            mGeomagnetic = event.values;
        }
        if (mGravity != null && mGeomagnetic != null) {
            float R[] = new float[9];
            float I[] = new float[9];
            boolean success = SensorManager.getRotationMatrix(R, I, mGravity, mGeomagnetic);
            if (success) {
                SensorManager.getOrientation(R, orientation);
                SensorManager.getQuaternionFromVector(quaternion, orientation);
                rot_X.setText("X:" + String.valueOf((int) (orientation[0]* (180/Math.PI))));
                rot_Y.setText("Y:" + String.valueOf((int) (orientation[1]* (180/Math.PI))));
                rot_Z.setText("Z:" + String.valueOf((int) (orientation[2]* (180/Math.PI))));
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

    /*private void handleGyroscope(SensorEvent event){
        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];
        if (!mInitialized) {
            mLastX = x;
            mLastY = y;
            mLastZ = z;
            rot_X.setText("0.0");
            rot_Y.setText("0.0");
            rot_Z.setText("0.0");
            mInitialized = true;
        } else {
            float deltaX = Math.abs(mLastX - x);
            float deltaY = Math.abs(mLastY - y);
            float deltaZ = Math.abs(mLastZ - z);
            if (deltaX < NOISE) deltaX = (float) 0.0;
            if (deltaY < NOISE) deltaY = (float) 0.0;
            if (deltaZ < NOISE) deltaZ = (float) 0.0;
            mLastX = x;
            mLastY = y;
            mLastZ = z;
            rot_X.setText("X:" + String.valueOf((int)x));
            rot_Y.setText("Y:" + String.valueOf((int)y));
            rot_Z.setText("Z:" + String.valueOf((int)z));
        }
    }

    public void handleAccelerometer(SensorEvent event) {

    }

    public void onSensorChanged(SensorEvent event) {
        if(event.sensor == gyro){
            handleGyroscope(event);
        }
        else if(event.sensor == accelerometer) {
            handleAccelerometer(event);
        }
    }*/

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