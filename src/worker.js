/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

 
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response('', {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method === 'POST' && url.pathname === '/comment') {
      // 发表新评论
      const key = url.searchParams.get('key');
      if (!key) return new Response('参数缺失', { status: 400, headers: corsHeaders() });
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response('请求体格式错误', { status: 400, headers: corsHeaders() });
      }
      // 支持 replyTo 字段
      const { nick, content, replyTo } = body;
      if (!nick || !content) return new Response('缺少昵称或内容', { status: 400, headers: corsHeaders() });
      const now = Date.now();
      // 生成唯一 id
      const id = now.toString(36) + Math.random().toString(36).slice(2, 8);
      const comment = { id, nick, content, date: now };
      if (replyTo) comment.replyTo = replyTo;
      // 取出原有评论
      let comments = [];
      const old = await env.COMMENTS_KV.get(key);
      if (old) {
        try { comments = JSON.parse(old); } catch {}
      }
      comments.push(comment);
      await env.COMMENTS_KV.put(key, JSON.stringify(comments));
      return new Response('ok', { status: 200, headers: corsHeaders() });
    }
    if (request.method === 'GET' && url.pathname === '/comment') {
      // 获取评论
      const key = url.searchParams.get('key');
      if (!key) return new Response('参数缺失', { status: 400, headers: corsHeaders() });
      let data = await env.COMMENTS_KV.get(key);
      // 如果不是合法的JSON数组，返回空数组
      let arr = [];
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            arr = parsed;
          }
        } catch {
          // 非法内容，返回空数组
        }
      }
      const headers = corsHeaders();
      headers['Content-Type'] = 'application/json';
      return new Response(JSON.stringify(arr), {
        headers
      });
    }
    return new Response('Not found', { status: 404, headers: corsHeaders() });
  }
}

// 统一 CORS 响应头
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}


// export default {
// 	async fetch(request, env, ctx) {
// 		return new Response('Hello World!');
// 	},
// };
