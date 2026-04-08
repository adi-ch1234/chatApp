import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
  try {
    const res = await cloudinary.uploader.upload("data:text/plain;base64,aGVsbG8=", { resource_type: "raw" });
    console.log("RAW URL:", res.secure_url);
  } catch (e) {
    console.error(e);
  }
}
test();
