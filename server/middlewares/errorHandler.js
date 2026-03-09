const errorHandler = (err, req, res, next) => {
  console.log("🔥🔥🔥 RAW ERROR OBJECT 🔥🔥🔥");
  console.log(err);
  console.log("🔥🔥🔥 STACK 🔥🔥🔥");
  console.log(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};

export default errorHandler;
