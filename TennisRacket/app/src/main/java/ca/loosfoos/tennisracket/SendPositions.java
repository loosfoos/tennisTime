package ca.loosfoos.tennisracket;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorManager;
import android.hardware.TriggerEvent;
import android.hardware.TriggerEventListener;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.TextView;

public class SendPositions extends AppCompatActivity {

    private SensorManager mSensorManager;
    private TriggerEventListener mTriggerEventListener;
    private Sensor mSensor;
    TextView rot_X;
    TextView rot_Y;
    TextView rot_Z;
    // Create a constant to convert nanoseconds to seconds.
    private static final float NS2S = 1.0f / 1000000000.0f;
    private final static double EPSILON = 0.00001;
    private final float[] deltaRotationVector = new float[4];
    private float rotationCurrent = 0;
    private float timestamp;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_send_positions);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
                        .setAction("Action", null).show();
            }
        });

        rot_X = (TextView) findViewById(R.id.textView);
        rot_Y = (TextView) findViewById(R.id.textView3);
        rot_Z = (TextView) findViewById(R.id.textView4);

        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        mSensor = mSensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
        if(mSensor != null)
        {

        mTriggerEventListener = new TriggerEventListener(){
            @Override
            public void onTrigger(TriggerEvent event) {
                if (timestamp != 0) {
                    final float dT = (event.timestamp - timestamp) * NS2S;
                    // Axis of the rotation sample, not normalized yet.
                    float axisX = event.values[0];
                    float axisY = event.values[1];
                    float axisZ = event.values[2];

                    // Calculate the angular speed of the sample
                    float omegaMagnitude = (float)Math.sqrt(axisX*axisX + axisY*axisY + axisZ*axisZ);

                    // Normalize the rotation vector if it's big enough to get the axis
                    // (that is, EPSILON should represent your maximum allowable margin of error)
                    if (omegaMagnitude > EPSILON) {
                        axisX /= omegaMagnitude;
                        axisY /= omegaMagnitude;
                        axisZ /= omegaMagnitude;
                    }

                    // Integrate around this axis with the angular speed by the timestep
                    // in order to get a delta rotation from this sample over the timestep
                    // We will convert this axis-angle representation of the delta rotation
                    // into a quaternion before turning it into the rotation matrix.
                    float thetaOverTwo = omegaMagnitude * dT / 2.0f;
                    float sinThetaOverTwo = (float)Math.sin(thetaOverTwo);
                    float cosThetaOverTwo = (float)Math.cos(thetaOverTwo);
                    deltaRotationVector[0] = sinThetaOverTwo * axisX;
                    deltaRotationVector[1] = sinThetaOverTwo * axisY;
                    deltaRotationVector[2] = sinThetaOverTwo * axisZ;
                    deltaRotationVector[3] = cosThetaOverTwo;

                    rot_X.setText("X:" + String.valueOf(deltaRotationVector[0]));
                    rot_Y.setText("Y:" + String.valueOf(deltaRotationVector[1]));
                    rot_Z.setText("Z:" + String.valueOf(deltaRotationVector[2]));
                }
                timestamp = event.timestamp;
                float[] deltaRotationMatrix = new float[9];
                SensorManager.getRotationMatrixFromVector(deltaRotationMatrix, deltaRotationVector);
                // User code should concatenate the delta rotation we computed with the current rotation
                // in order to get the updated rotation.
                //rotationCurrent = rotationCurrent * deltaRotationMatrix;

            }
        };
        mSensorManager.requestTriggerSensor(mTriggerEventListener, mSensor);
        }
    }

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