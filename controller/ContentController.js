const mongoose=require("mongoose")
const TcPp = mongoose.model("TcPp");

const getContent = async (req, res) => {
  try {
    const type = req?.body?.type;
    const types = [
      "privacy_policy",
      "terms_and_conditions",
      "about_us",
      "help_and_support",
      "information",
    ];
    if (!type) {
      return res.status(400).send({
        status: 0,
        message: "please enter a content type",
      });
    } else if (!types.includes(type)) {
      return res.status(400).send({
        status: 0,
        message: `Accepted types are limited to the following: "privacy_policy", "terms_and_conditions", "about_us", "help_and_support", and "information".`,
      });
    }
    const content = await TcPp.findOne({ contentType: type });
    if (!content) {
      return res.status(400).send({
        status: 0,
        message: "content not found",
      });
    } else {
      return res.status(200).send({
        status: 1,
        message: `fetched ${type} successfully`,
        data:{url:``,content},
      });
    }
  } catch (err) {
    console.error("error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

const getInformation=async(req,res)=>{
  try{
    const content=await TcPp.findOne({ contentType: "information"});
    if (!content) {
      return res.status(400).send({
        status: 0,
        message: "content not found",
      });
    } else {
      return res.status(200).send({
        status: 1,
        message: `fetched information successfully`,
       data:content
      });
    }
  }catch(err){
    console.error("error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
}

const getAllContent = async (req, res) => {
  try {
    const content = await TcPp.find({});
    if (!content) {
      return res.status(400).send({
        status: 0,
        message: "content not found",
      });
    } else {
      return res.status(200).send({
        status: 1,
        message: `fetched content successfully`,
        data:{content},
      });
    }
  } catch (err) {
    console.error("error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

const editContent = async (req, res) => {
  try {
    const { type, title, content } = req?.body;
    const types = [
      "privacy_policy",
      "terms_and_conditions",
      "about_us",
      "help_and_support",
      "information",
    ];
    if (!type) {
      return res.status(400).send({
        status: 0,
        message: "please enter a content type",
      });
    } else if (!types.includes(type)) {
      return res.status(400).send({
        status: 0,
        message: `Accepted types are limited to the following: "privacy_policy", "terms_and_conditions", "about_us", "help_and_support", and "information".`,
      });
    }
    const contentExists = await TcPp.findOne({ contentType: type });
    if (!contentExists) {
      return res.status(400).send({
        status: 0,
        message: "content not found",
      });
    }
    const contentImage = req?.files?.companyImage;
    const contentImagePath = contentImage
      ? contentImage[0]?.path?.replace(/\\/g, "/")
      : null;
    const updateContent = await TcPp.findOneAndUpdate(
      { contentType: type },
      {
        title,
        content,
        companyImage:contentImagePath
      },
      { new: true }
    );
    return res.status(200).send({
      status: 1,
      message: "content updated successfully!",
      data:{content: updateContent},
    });
  } catch (err) {
    console.error("error", err.message);
    return res.status(500).send({
      status: 0,
      message: "Something went wrong",
    });
  }
};

module.exports = { getContent,editContent,getAllContent, getInformation };
