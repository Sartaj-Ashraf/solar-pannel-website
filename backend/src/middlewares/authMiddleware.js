// import { UnAuthenticatedErr } from "../errors/customErors.js";
// import { verifyJWT } from "../utils/tokenUtils.js";

// export const authenticateUser = async (req, res, next) => {
//   const { token } = req.cookies;
//   if (!token) throw new UnAuthenticatedErr("authentication invalid");
//   try {
//     const { userId, role } = verifyJWT(token);
//     req.user = { userId, role };
//     next();
//   } catch {
//     throw new UnAuthenticatedErr("authentication invalid");
//   }
// };

// // export const authenticateUserRole = async (req, res, next) => {
// //   const { token } = req.cookies;
// //   // if (!token) throw new UnAuthenticatedErr("authentication invalid");
// //   try {
// //     const { userId, role } = verifyJWT(token);
// //     req.user = { userId, role };
// //     next();
// //   } catch {
// //     throw new UnAuthenticatedErr("authentication invalid");
// //   }
// // };
import { UnAuthenticatedErr, UnauthorizedErr } from "../errors/customErors.js";
import { verifyJWT } from "../utils/tokenUtils.js";

export const authenticateUser = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    throw new UnAuthenticatedErr(
      "Authentication invalid - Please sign in"
    );
  }

  try {
    const { userId, role, email } = verifyJWT(token);
    req.user = { userId, role, email };
    next();
  } catch (error) {
    throw new UnAuthenticatedErr(
      "Authentication invalid - Please sign in"
    );
  }
};


// Optional authentication - doesn't throw error if no user
export const optionalAuth = (req, res, next) => {
  const token = req.cookies.token;
  
  // If no token or logout token, set user to null and continue
  if (!token || token === 'logout') {
    req.user = null;
    return next();
  }
  
  try {
    const payload = verifyJWT(token);
    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email
    };
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};


export const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedErr("Unauthorized to access this route");
    }
    next();
  };
};
