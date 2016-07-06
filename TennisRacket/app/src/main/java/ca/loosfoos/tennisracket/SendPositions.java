package ca.loosfoos.tennisracket;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.TriggerEvent;
import android.hardware.TriggerEventListener;
import android.opengl.Matrix;
import android.os.Bundle;
import android.os.SystemClock;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.io.BufferedWriter;
import java.io.Console;
import java.io.File;
import java.io.FileWriter;
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
    private Sensor rotationVector;
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
    EditText ipText;
    // Create a constant to convert nanoseconds to seconds.
    private static final float NS2S = 1.0f / 1000000000.0f;
    private final static double EPSILON = 0.001;
    private final float[] deltaRotationVector = new float[4];
    private float rotationCurrent = 0;
    private float timestamp;
    private InetAddress ipAddress = null;
    DatagramSocket client_socket = null;


    float[] lastRotationMatrix = new float[16];
    float[] mGravity;
    float[] mGeomagnetic;
    private float gravity;
    float accuracy;
    float I[] = new float[9];
    float orientation[] = new float[3];
    float quaternion[] = new float[4];
    double[] speed = new double[3];
    double [] rawSpeed = new double[3];
    //double[] position = new double[3];
    long lastTimeMili = 0;

    Thread dataSenderThread;
    boolean exitThread;

    DataLogger accLogger;

    //kalmanFilter
    KalmanFilter []kalmanFilters = new KalmanFilter[3];
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //accLogger = new DataLogger("acc_x.txt");
        setContentView(R.layout.activity_send_positions);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        ipText = (EditText)findViewById(R.id.ipText);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        ipText.setText("192.168.5.62");

        Button b = (Button)findViewById(R.id.button);

        b.setOnClickListener(
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        if(dataSenderThread != null && dataSenderThread.isAlive())
                        {
                            exitThread = true;
                            try{
                                dataSenderThread.join();
                            }
                            catch(InterruptedException e)
                            {
                                e.printStackTrace();
                            }
                            exitThread = false;
                        }

                        dataSenderThread = new Thread(new Runnable() {
                            @Override
                            public void run() {

                                try{
                                    client_socket = new DatagramSocket(5000);
                                } catch(SocketException e1){
                                    e1.printStackTrace();
                                }

                                try{
                                    ipAddress = InetAddress.getByName(ipText.getText().toString());
                                }
                                catch(UnknownHostException e2){
                                    e2.printStackTrace();
                                }

                                float oldX = 0, oldY = 0, oldZ = 0;
                                float[] rotation = {0,0,0,0};


                                try {
                                    for (;;) {
                                        if(exitThread){
                                            break;
                                        }
                                        if (!suspended) {
                                            rotation[0] = orientation[0];
                                            rotation[1] = orientation[1];
                                            rotation[2] = orientation[2];
                                            if (oldX != rotation[0] || oldY != rotation[1] || oldZ != rotation[2]) {
                                                oldX = rotation[0];
                                                oldY = rotation[1];
                                                oldZ = rotation[2];
                                                String str = String.valueOf(quaternion[0]) + "," + String.valueOf(quaternion[1]) + "," + String.valueOf(quaternion[2]) + "," + String.valueOf(quaternion[3])
                                                        + "," + String.valueOf(acc[0])+ "," + String.valueOf(acc[1])+ "," + String.valueOf(acc[2])
                                                        + "," + String.valueOf(speed[0])+ "," + String.valueOf(speed[1])+ "," + String.valueOf(speed[2])
                                                        + "," + String.valueOf(rawSpeed[0])+ "," + String.valueOf(rawSpeed[1])+ "," + String.valueOf(rawSpeed[2]);
                                                byte[] send_data = str.getBytes();

                                                DatagramPacket send_packet = new DatagramPacket(send_data, str.length(), ipAddress, 5000);
                                                try {
                                                    client_socket.send(send_packet);
                                                } catch (Exception e1) {
                                                    e1.printStackTrace();
                                                }
                                            }
                                        }
                                        SystemClock.sleep(100);runOnUiThread(new Runnable() {
                                            @Override
                                            public void run() {
                                                rot_X.setText("X:" + String.valueOf((int) (orientation[1] * (180 / Math.PI))));
                                                rot_Y.setText("Y:" + String.valueOf((int) (orientation[2] * (180 / Math.PI))));
                                                rot_Z.setText("Z:" + String.valueOf((int) (orientation[0] * (180 / Math.PI))));
                                                acc_X.setText("X:" + String.valueOf((int) (acc[0]*100)));
                                                acc_Y.setText("Y:" + String.valueOf((int) (acc[1]*100)));
                                                acc_Z.setText("Z:" + String.valueOf((int) (acc[2]*100)));

                                                try {
                                                    wait(300);
                                                }
                                                catch(Exception e) {
                                                    e.printStackTrace();
                                                }
                                            }
                                        });
                                    }
                                }
                                catch(Exception exp) {
                                    exp.printStackTrace();
                                }
                            }
                        });

                        dataSenderThread.start();
                    }
                }
        );


        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                lastTimeMili = 0;
                speed[0] = 0;
                speed[1] = 0;
                speed[2] = 0;
                rawSpeed[0] = 0;
                rawSpeed[1] = 0;
                rawSpeed[2] = 0;
            }
        });
        rot_X = (TextView) findViewById(R.id.x);
        rot_Y = (TextView) findViewById(R.id.y);
        rot_Z = (TextView) findViewById(R.id.z);

        acc_X = (TextView) findViewById(R.id.acc_x);
        acc_Y = (TextView) findViewById(R.id.acc_y);
        acc_Z = (TextView) findViewById(R.id.acc_z);


        //float [] orientOffset = new float[]{1,1,0};
        //SensorManager.getQuaternionFromVector(quaternionOffsetAtStart, orientOffset);

        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        rotationVector = mSensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        accelerometer =  mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        magnetometer = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        try {
            mTriggerEventListener = new TriggerEventListener() {
                @Override
                public void onTrigger(TriggerEvent event) {
                    // Do work
                }
            };

            mSensorManager.requestTriggerSensor(mTriggerEventListener, rotationVector);
            mSensorManager.requestTriggerSensor(mTriggerEventListener, accelerometer);
            mSensorManager.requestTriggerSensor(mTriggerEventListener, magnetometer);
        }
        catch(Exception ex) {
            Log.d("TAG", "onCreate: " + ex.getMessage());
        }

    }

    @Override
    protected void onResume() {
        try{
            client_socket = new DatagramSocket(5000);
        } catch(SocketException e1){
            e1.printStackTrace();
        }
        mSensorManager.registerListener(this, rotationVector, SensorManager.SENSOR_DELAY_FASTEST);
        mSensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_FASTEST);
        mSensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_FASTEST);
        super.onResume();
        suspended = false;
    }

    @Override
    protected void onPause() {
        suspended = true;
        mSensorManager.unregisterListener(this, rotationVector);
        mSensorManager.unregisterListener(this, accelerometer);
        mSensorManager.unregisterListener(this, magnetometer);
        client_socket.disconnect();
        client_socket.close();
        super.onPause();
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int i){
        accuracy = (float)Math.pow(10.0, 0-i);

        for(int j = 0;j<3;j++)
        {
            kalmanFilters[j] = new KalmanFilter(1.125, 0, 0.0, 0.0);
        }
    }

    float[] acc = new float[4];
    float[] pastAcc = new float[4];
    float[] RM = new float[16];
    float startTimeStamp;
    public void onSensorChanged(SensorEvent event) {
        if(event.sensor.getType() == Sensor.TYPE_ROTATION_VECTOR)
        {
            SensorManager.getQuaternionFromVector(quaternion, event.values);
        }
        else if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            mGravity = event.values;

            if(timestamp != 0) {
                final float deltaTime = (event.timestamp - timestamp) * NS2S;
                //Log.d("TAG", "deltaTime: " + deltaTime);

                float[] accT = new float[4];
                accT[0] = mGravity[0];
                accT[1] = mGravity[1];
                accT[2] = mGravity[2] ;
                accT[3] = 0;
                float[] accTer = new float[16];

                Matrix.invertM(accTer, 0, RM, 0);

                Matrix.multiplyMV(acc, 0, RM, 0, accT,0);



                //Matrix.multiplyMV(acc, 0, RM, 0, accT, 0);
                acc[2] -= (float)SensorManager.GRAVITY_EARTH;
                for(int i = 0; i<3; i++)
                {

                    if(kalmanFilters[i] != null)
                    {
                            kalmanFilters[i].update(acc[i]);
                        speed[i] = speed[i] + kalmanFilters[i].getEstimate()*deltaTime;

                    }

                    if(acc[i] > EPSILON) {
                        rawSpeed[i] = rawSpeed[i] + acc[i] * deltaTime;
                    }
                    //position[i] = position[i] + speed[i]*deltaTime;
                }
                //accLogger.logData(",{x:" +String.valueOf(acc[0]) + ",t:"+ String.valueOf(event.timestamp - startTimeStamp) +"}");


                //appendLog(accBuffer, String.valueOf(acc[0]));
                //appendLog(speedBuffer, String.valueOf(speed[0]));
                //appendLog(tBuffer, String.valueOf(deltaTime));


            }
            else {
                //accLogger.logData("{x:" +String.valueOf(acc[0]) + ",t:0.0}");
            }
            pastAcc[0] = acc[0];
            pastAcc[1] = acc[1];
            pastAcc[2] = acc[2];
            timestamp = event.timestamp;
            startTimeStamp = event.timestamp;
        }
        else if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            mGeomagnetic = event.values;
            if (mGravity != null && mGeomagnetic != null) {
                float R[] = new float[16];
                boolean success = SensorManager.getRotationMatrix(RM, lastRotationMatrix, mGravity, mGeomagnetic);
                if (success) {
                    SensorManager.getOrientation(RM, orientation);
                    /*float[] accT = new float[4];
                    accT[0] = mGravity[0];
                    accT[1] = mGravity[1];
                    accT[2] = mGravity[2] ;
                    accT[3] = 0;

                    float[] gravityPull = new float[4];
                    Matrix.multiplyMV(acc, 0, RM, 0, accT, 0);

                    Matrix.invertM(accTer, 0, RM, 0);
                    Matrix.multiplyMV(gravityPull, 0, accTer, 0, accT,0);
                    gravity = gravityPull[2];
                    float[] accTer = new float[16];
                    //Matrix.invertM(accTer, 0, RM, 0);

                    Matrix.multiplyMV(acc, 0, RM, 0, accT,0);
                    if(timestamp != 0) {
                        final float deltaTime = (event.timestamp - timestamp) * NS2S;
                        for (int i = 0; i < 3; i++) {
                            if(Math.abs(acc[i]) < accuracy)
                            {
                                acc[i] = 0;
                            }

                            if (kalmanFilters[i] != null) {
                                speed[i] = speed[i] + kalmanFilters[i].getEstimate() * deltaTime;
                                kalmanFilters[i].update(acc[i]);
                            }
                            rawSpeed[i] = rawSpeed[i] + acc[i] * deltaTime;
                            //position[i] = position[i] + speed[i]*deltaTime;
                        }
                    }
                    timestamp = event.timestamp;
                    startTimeStamp = event.timestamp;*/
                }
            }
        }
    }

    public BufferedWriter initLogFile(File logFile) {
        BufferedWriter buf = null;
        if (!logFile.exists())
        {
            try
            {
                logFile.createNewFile();
            }
            catch (IOException e)
            {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }
        try {
            //BufferedWriter for performance, true to set append to file flag
            buf = new BufferedWriter(new FileWriter(logFile, true));
        }
        catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return buf;
    }

    public void appendLog(BufferedWriter buffer, String text)
    {
        try {
            //BufferedWriter for performance, true to set append to file flag
            buffer.append(text);
        }
        catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
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