import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SITE_NAME: "MedGen",
  },
};

export default config;
