// Cloudflare Pages Function to handle all routes
export const onRequest = async (context: any) => {
  const { request, next } = context;
  
  // Pass through to Next.js app
  return next();
};

export const config = {
  runtime: 'edge',
};
