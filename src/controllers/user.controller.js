import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateaccessAndRefreshTokens = async(userId)=>{
  try {
    const user=await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "Something went wrong")
  }
}
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  //console.log("email", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "All fields are  required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(400, "User's email or username exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLoacalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Error while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async(req,res)=>{
  // req.dat ->data,
  //username or email
  // find user
  //password check
  //access and refresh token gen
  // send cookie

  const {email, username, password} = req.body

  if(!username || ! email){
    throw new ApiError (400, "Username or email is required")
  }

  const user = await User.findOne({
    $or:[{username}, {email}]
  })

  if(!user){
    throw new ApiError(404, "User does not exist")
  }

  const isPasswordValid=await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(404, "Invalid credentials")
  }

  const {accessToken, refreshToken}=await generateaccessAndRefreshTokens(user._id)

  const loggedInUser=User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly :true,
    secure:true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser, accessToken, refreshToken
      },
      "User logged in Successfully"
    )
  )
})

const logoutUser = asyncHandler(async(req,res)=>{
 User.findOneAndUpdate(
  rew.user._id,
  {
    $set:{
      refreshToken:undefined
    }
  },
  {
    new:true
  }
 )

  const options = {
    httpOnly :true,
    secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

export { registerUser , loginUser, logoutUser};
