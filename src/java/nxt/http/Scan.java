package nxt.http;

import nxt.Nxt;
import org.json.simple.JSONObject;
import org.json.simple.JSONStreamAware;

import javax.servlet.http.HttpServletRequest;

public final class Scan extends APIServlet.APIRequestHandler {

    static final Scan instance = new Scan();

    private Scan() {
        super(new APITag[] {APITag.DEBUG}, "numBlocks", "height", "validate");
    }

    @Override
    JSONStreamAware processRequest(HttpServletRequest req) {
        JSONObject response = new JSONObject();
        try {
            boolean validate = "true".equalsIgnoreCase(req.getParameter("validate"));
            int numBlocks = 0;
            try {
                numBlocks = Integer.parseInt(req.getParameter("numBlocks"));
            } catch (NumberFormatException ignored) {}
            int height = -1;
            try {
                height = Integer.parseInt(req.getParameter("height"));
            } catch (NumberFormatException ignore) {}
            long start = System.currentTimeMillis();
            try {
                Nxt.getBlockchainProcessor().setGetMoreBlocks(false);
                if (numBlocks > 0) {
                    Nxt.getBlockchainProcessor().scan(Nxt.getBlockchain().getHeight() - numBlocks + 1, validate);
                } else if (height >= 0) {
                    Nxt.getBlockchainProcessor().scan(height, validate);
                } else {
                    return JSONResponses.missing("numBlocks", "height");
                }
            } finally {
                Nxt.getBlockchainProcessor().setGetMoreBlocks(true);
            }
            long end = System.currentTimeMillis();
            response.put("done", true);
            response.put("scanTime", (end - start)/1000);
        } catch (RuntimeException e) {
            JSONData.putException(response, e);
        }
        return response;
    }

    @Override
    final boolean requirePost() {
        return true;
    }

    @Override
    boolean requirePassword() {
        return true;
    }
}
