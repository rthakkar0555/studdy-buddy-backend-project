const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
      Promise.resolve(requestHandler(req, res, next))
      .catch((err) => next(err))
  }
}

export default asyncHandler


//another way to do it


// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//       await fn(req, res, next); // Await async function and pass correct arguments
//   } catch (error) {
//       res.status(error.statusCode || 500).json({
//           success: false,
//           message: error.message || "Internal Server Error"
//       });
//   }
// };
