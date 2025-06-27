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
    if (request.method === 'POST' && url.pathname === '/comment') {
      // 发表新评论
      const { key, nick, content } = await request.json();
      if (!key || !nick || !content) {
        return new Response('参数缺失', { status: 400 });
      }
      const now = new Date().toISOString();
      const comment = { nick, content, date: now };
      // 取出原有评论
      let comments = [];
      const old = await env.COMMENTS_KV.get(key);
      if (old) {
        try { comments = JSON.parse(old); } catch {}
      }
      comments.push(comment);
      await env.COMMENTS_KV.put(key, JSON.stringify(comments));
      return new Response('ok', { status: 200 });
    }
    if (request.method === 'GET' && url.pathname === '/comment') {
      // 获取评论
      const key = url.searchParams.get('key');
      if (!key) return new Response('参数缺失', { status: 400 });
      const data = await env.COMMENTS_KV.get(key);
      return new Response(data || '[]', {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('Not found', { status: 404 });
  }
}