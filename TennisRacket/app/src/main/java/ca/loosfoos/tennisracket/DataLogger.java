package ca.loosfoos.tennisracket;

import android.os.Environment;
import java.io.FileOutputStream;
import java.io.File;

/**
 * Created by User on 2016-06-11.
 */
public class DataLogger {
    FileOutputStream fileOutput;
    private String fileName;
    private File outputFile;
    FileOutputStream outputStream;
    public DataLogger(String fileName ) {
        File sdCard = Environment.getExternalStorageDirectory();
        this.fileName = sdCard.getAbsolutePath() + "/" + fileName;
        outputFile = new File(this.fileName);
        try {
            outputStream = new FileOutputStream(outputFile);
        }catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void finalize() throws Throwable {
        outputStream.close();
        super.finalize();
    }

    public void logData(String data) {
        try {
            outputStream.write(data.getBytes(), 0, data.length());
        }
        catch(Exception e) {
            e.printStackTrace();
        }
    }
}
