package ca.loosfoos.tennisracket;

/**
 * Created by User on 2016-06-11.
 */
public class KalmanFilter {
    class KalmanState
    {
        //process noise covariance
        double q;

        //measurement noise covariance
        double r;

        //value
        double x;

        //estimation error covariance
        double p;

        //kalman gain
        double k;
    }

    KalmanState state;

    public KalmanFilter(double q, double r, double p, double intial_value){
        state.q = q;
        state.r = r;
        state.p = p;
        state.x = intial_value;
    }

    public void update(double measurement)
    {
        //prediction update
        //omit x = x
        state.p = state.p + state.q;

        //measurement update
        state.k = state.p / (state.p + state.r);
        state.x = state.x + state.k * (measurement - state.x);
        state.p = (1 - state.k) * state.p;
    }
}
