const mongoose = require("mongoose");
const Service = mongoose.model("service");
const BookService = mongoose.model("bookService");

const createService = async (req, res) => {
  try {
    const { title, content } = req?.body;
    if (!title) {
      return res.status(400).send({
        status: 0,
        message: "please enter title",
      });
    } else if (!content) {
      return res.status(400).send({
        status: 0,
        message: "please enter content",
      });
    }
    const serviceImage = req?.files?.serviceImage;
    const serviceImagePath = serviceImage
      ? serviceImage[0]?.path?.replace(/\\/g, "/")
      : null;
    const service = await Service.create({
      title,
      content,
      serviceImage: serviceImagePath,
    });
    return res.status(200).send({
      status: 1,
      message: "service created succesfully",
      data: service,
    });
  } catch (err) {
    console.error("Error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

const editService = async (req, res) => {
  try {
    const { title, content, id } = req?.body;
    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "please enter ID",
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        status: 0,
        message: "please enter a valid ID",
      });
    } else if (!title) {
      return res.status(400).send({
        status: 0,
        message: "please enter title",
      });
    } else if (!content) {
      return res.status(400).send({
        status: 0,
        message: "please enter content",
      });
    }
    const service = await Service.findById(id);
    if (!service) {
      return res.status(400).send({
        status: 0,
        message: "service not found",
      });
    }
    const serviceImage = req?.files?.serviceImage;
    const serviceImagePath = serviceImage
      ? serviceImage[0]?.path?.replace(/\\/g, "/")
      : null;
    // console.log(serviceImagePath)
    const updateService = await Service.findByIdAndUpdate(
      id,
      {
        title,
        content,
        serviceImage: serviceImagePath,
      },
      { new: true }
    );
    return res.status(200).send({
      status: 1,
      message: "updated service successfully!",
      data: updateService,
    });
  } catch (err) {
    console.error("Error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const id = req?.query?.id;
    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "please enter ID",
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        status: 0,
        message: "please enter a valid ID",
      });
    }
    const service = await Service.findById(id);
    if (!service) {
      return res.status(400).send({
        status: 0,
        message: "service not found",
      });
    }
    await BookService.deleteMany({ serviceId: id });
    await Service.findByIdAndDelete(id);
    return res.status(200).send({
      status: 1,
      message: "service deleted successfully",
    });
  } catch (err) {
    console.error("Error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

const getAllServices = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const page = req?.query?.page || 1;
    const limit = req?.query?.limit;
    const effectiveLimit =
      limit && !isNaN(parseInt(limit)) && parseInt(limit) > 0
        ? parseInt(limit)
        : Number.MAX_SAFE_INTEGER;
    const startIndex = (page - 1) * effectiveLimit;
    // console.log("effectiveLimit",startIndex)
    const totalServices = await Service.countDocuments({});
    const services = await Service.aggregate([
      {
        $lookup: {
          from: "bookservices", // collection
          let: { service_id: "$_id" }, // localField
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$serviceId", "$$service_id"] }, // foreignField
                    { $eq: ["$userId", new mongoose.Types.ObjectId(userId)] }, // foreignField
                  ],
                },
              },
            },
          ],
          as: "bookedservice", // result
        },
      },
      {
        $unwind:{
          path:"$bookedservice",
          preserveNullAndEmptyArrays:true
        }
      },
      {
        $addFields:{
          isBooked:{
          $cond:{
            if:{
              $eq:["$bookedservice.userId",new mongoose.Types.ObjectId(userId)]
            },
            then:1,
            else:0
          }
          }
        }
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: parseInt(startIndex),
      },
      {
        $limit: parseInt(effectiveLimit),
      },
      {
        $unset: ["bookedservice"],
      },
    ]);
    return res.status(200).send({
      status: 1,
      message: "fetched all services",
      data: {
        totalServices,
        services,
      },
    });
    // const services = await Service.aggregate([
    //   {
    //     $lookup: {
    //       from: "bookservices",
    //       localField: "_id",
    //       foreignField: "serviceId",
    //       as: "bookedservices",
    //     },
    //   },
    //   {
    //     $addFields: {
    //       isBooked: {
    //         $cond: {
    //           if: {
    //             $in: [
    //               true,
    //               {
    //                 $map: {
    //                   input: "$bookedservices",
    //                   as: "bookedservice",
    //                   in: {
    //                     $eq: [
    //                       "$$bookedservice.userId",
    //                       new mongoose.Types.ObjectId(req?.user?._id),
    //                     ],
    //                   },
    //                 },
    //               },
    //             ],
    //           },
    //           then: 1,
    //           else: 0,
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $sort: { createdAt: -1 },
    //   },
    //   {
    //     $skip: parseInt(startIndex),
    //   },
    //   {
    //     $limit: parseInt(effectiveLimit),
    //   },
    //   {
    //     $unset: ["bookedservices"],
    //   },
    // ]);
    // if (services?.length < 1) {
    //   return res.status(200).send({
    //     status: 1,
    //     message: "no services found!",
    //   });
    // } else {
    //   return res.status(200).send({
    //     status: 1,
    //     message: "fetched all services",
    //     data: services,
    //   });
    // }
    // const services=await Service.aggregate([
    //   {
    //     $skip:startIndex
    //   },
    //   {
    //     $limit:parseInt(limit)
    //   }
    // ])
    // const endIndex = page * limit;
    // const serviceCount=await Service.countDocuments({});
    // const totalPages=Math.ceil(serviceCount/limit);
    // const services = await Service.find({}).sort({ createdAt: -1 });
    // if (services?.length < 1) {
    //   return res.status(200).send({
    //     status: 1,
    //     message: "no services found!",
    //   });
    // } else {
    //   const servicePage = await Service.find({})
    //     .sort({ createdAt: -1 })
    //     .limit(limit)
    //     .skip(startIndex);
    //   return res.status(200).send({
    //     status: 1,
    //     message: "fetched all services",
    //     data: {
    //       totalServices:serviceCount,
    //       page: parseInt(page),
    //       perPage:parseInt(limit),
    //       totalPages,
    //       services: servicePage,
    //     },
    //   });
    // }
  } catch (err) {
    console.error("Error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
      err: err.message,
    });
  }
};

const getServiceDetails = async (req, res) => {
  try {
    const id = req?.query?.id;
    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "please enter ID",
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        status: 0,
        message: "please enter a valid ID",
      });
    }
    const service = await Service.findById(id);
    if (!service) {
      return res.status(400).send({
        status: 0,
        message: "service not found",
      });
    } else {
      return res.status(200).send({
        status: 0,
        message: "service fetched successfully",
        data: service,
      });
    }
  } catch (err) {
    console.error("Error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

//book service
const bookService = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const id = req?.body?.id;
    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "please enter ID",
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        status: 0,
        message: "please enter a valid ID",
      });
    }
    const service = await Service.findById(id);
    if (!service) {
      return res.status(400).send({
        status: 0,
        message: "service not found",
      });
    }
    const book_service = await BookService.findOne({
      userId: userId,
      serviceId: id,
    });
    if (book_service) {
      return res.status(200).send({
        status: 0,
        message: "user has already booked service",
      });
      // const booked_service_id = book_service?._id;
      // const isBooked = book_service?.isBooked;
      // const updateook_service = await BookService.findByIdAndUpdate(
      //   booked_service_id,
      //   {
      //     isBooked: !isBooked,
      //   },
      //   { new: true }
      // );
      // if (isBooked) {
      //   return res.status(200).send({
      //     status: 1,
      //     message: "service has been successfully booked",
      //     data: updateook_service,
      //   });
      // } else {
      //   return res.status(200).send({
      //     status: 1,
      //     message: "service booking has been canceled",
      //     data: updateook_service,
      //   });
      // }
    } else {
      const bookingService = new BookService({
        userId: userId,
        serviceId: id,
        isBooked: 1,
      });
      const data = await bookingService.save();
      return res.status(200).send({
        status: 1,
        message: "service has been successfully booked",
        data,
      });
    }
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

const unBookService = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const id = req?.body?.id;
    if (!id) {
      return res.status(400).send({
        status: 0,
        message: "please enter ID",
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        status: 0,
        message: "please enter a valid ID",
      });
    }
    const service = await Service.findById(id);
    if (!service) {
      return res.status(400).send({
        status: 0,
        message: "service not found",
      });
    }
    const bookedService = await BookService.findOne({
      userId: userId,
      serviceId: id,
    });
    if (bookedService) {
      await BookService.findByIdAndDelete(bookedService?._id);
      return res.status(200).send({
        status: 1,
        message: "service has been successfully unbooked",
      });
    } else {
      return res.status(200).send({
        status: 1,
        message: "user has not booked service",
      });
    }
  } catch (err) {
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createService,
  editService,
  deleteService,
  getAllServices,
  getServiceDetails,
  bookService,
  unBookService,
};
