const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  basePath: basePath && basePath !== "/" ? basePath : undefined
};

export default nextConfig;
