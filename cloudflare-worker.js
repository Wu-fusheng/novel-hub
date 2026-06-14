/**
 * Cloudflare Worker - Vercel 反向代理
 * 将请求转发到 Vercel，利用 Cloudflare 的 CDN 加速国内访问
 */

// 你的 Vercel 域名
const VERCEL_DOMAIN = 'novel-hub-liard.vercel.app';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 构建目标 URL
    const targetUrl = new URL(url.pathname + url.search, `https://${VERCEL_DOMAIN}`);
    
    // 创建新的请求
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'Host': VERCEL_DOMAIN,
      },
      body: request.body,
    });

    try {
      // 转发请求到 Vercel
      const response = await fetch(modifiedRequest);
      
      // 创建新的响应，添加 CORS 头
      const modifiedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });

      return modifiedResponse;
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};
