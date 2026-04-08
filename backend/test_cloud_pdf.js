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
    const dataUri = "data:application/pdf;base64,JVBERi0xLjEKJcKlwrEKNyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDEgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9SZXNvdXJjZXMgMyAwIFIKL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago=";
    const res = await cloudinary.uploader.upload(dataUri, { resource_type: "raw" });
    console.log("RAW PDF URL:", res.secure_url);
  } catch (e) {
    console.error(e);
  }
}
test();
