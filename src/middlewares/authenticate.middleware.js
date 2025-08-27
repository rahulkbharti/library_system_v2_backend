import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: process.env.ENV_FILE || '.env.development' });

let secretKey;
const getSecretKey = () => {
  if (!secretKey) {
    secretKey = process.env.SECRET_KEY;
    if (!secretKey) throw new Error('JWT secret key not configured');
  }
  return secretKey;
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, getSecretKey());

    // Attach user to request
    req.user = decoded;
    req.organization_ids = decoded.organization_ids;

    // console.log("req.user:", req.user);
    console.log("req.organization_ids:", req.organization_ids);

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

export default authenticate;