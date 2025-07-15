// /api/generate.js

// Vercel 서버리스 함수는 기본적으로 export default로 함수를 내보냅니다.
export default async function handler(request, response) {
  // POST 요청만 허용합니다.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel에 설정한 환경 변수에서 API 키를 가져옵니다.
  const apiKey = process.env.GOOGLE_API_KEY;
  // 클라이언트(index.html)에서 보낸 요청 본문에서 프롬프트를 추출합니다.
  const { prompt } = request.body;

  // 필수 값들이 있는지 확인합니다.
  if (!apiKey) {
    // 서버 측 에러이므로 클라이언트에게는 자세한 정보를 노출하지 않습니다.
    console.error('Server Error: GOOGLE_API_KEY is not set in environment variables.');
    return response.status(500).json({ error: '서버 설정에 오류가 발생했습니다.' });
  }
  if (!prompt) {
    return response.status(400).json({ error: '프롬프트가 필요합니다.' });
  }

  // Google AI API 엔드포인트
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
  
  // Google AI API에 보낼 요청 본문
  const requestBody = {
    "instances": [{ "prompt": prompt }],
    "parameters": { "sampleCount": 1 }
  };

  try {
    // fetch API를 사용하여 Google AI 서버에 실제 요청을 보냅니다.
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    // Google로부터 받은 응답을 파싱합니다.
    const data = await googleResponse.json();

    // Google API가 에러를 반환한 경우
    if (!googleResponse.ok) {
      console.error('Google API Error:', data);
      // 클라이언트에게는 간단한 에러 메시지를 보냅니다.
      const errorMessage = data?.error?.message || 'Google API 처리 중 오류 발생';
      return response.status(googleResponse.status).json({ error: errorMessage });
    }

    // 성공적인 응답을 클라이언트(index.html)에게 그대로 전달합니다.
    return response.status(200).json(data);

  } catch (error) {
    // 네트워크 오류 등 예기치 못한 에러 처리
    console.error('Internal Server Error:', error);
    return response.status(500).json({ error: '이미지 생성 중 내부 서버 오류가 발생했습니다.' });
  }
}

