'use client'

export default function TestOAuthPage() {
  const APP_ID = '6bdd44e5-d47a-4442-a058-539398394258'
  const REDIRECT_URI = 'http://localhost:3000/api/auth/callback/secondme'
  const SCOPE = 'user.info user.info.shades user.info.softmemory chat note.add'

  const testUrls = [
    {
      name: '方案1: go.second.me/oauth (无 /authorize)',
      url: `https://go.second.me/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}`
    },
    {
      name: '方案2: go.second.me/auth',
      url: `https://go.second.me/auth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}`
    },
    {
      name: '方案3: develop.second.me/oauth/authorize',
      url: `https://develop.second.me/oauth/authorize?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}`
    },
    {
      name: '方案4: second.me/oauth/authorize',
      url: `https://second.me/oauth/authorize?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}`
    },
    {
      name: '方案5: app.mindos.com OAuth',
      url: `https://app.mindos.com/oauth/authorize?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}`
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">SecondMe OAuth 端点测试</h1>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <p className="text-sm">
            点击下面的链接测试不同的 OAuth 授权端点。
            如果能正常显示授权页面，说明该端点正确。
          </p>
        </div>

        <div className="space-y-4">
          {testUrls.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-lg mb-2">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-3 break-all">{item.url}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                测试此端点
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
          <h3 className="font-bold mb-2">如何使用：</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>依次点击"测试此端点"按钮</li>
            <li>如果跳转到 SecondMe 授权页面，说明该端点正确</li>
            <li>记录正确的 URL 格式</li>
            <li>更新 lib/secondme.ts 中的配置</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
