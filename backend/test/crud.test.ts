import axios from 'axios'

const BASE_URL = 'http://localhost:3001'
let authToken = ''
let testUserId = ''
let testPostId = ''
let testBoardId = ''
let testCommentId = ''
let testChatRoomId = ''

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`✅ ${name}`)
  } catch (e: any) {
    console.error(`❌ ${name}:`, e.response?.data || e.message)
  }
}

async function runTests() {
  console.log('\n🎵 반모 CRUD 전체 테스트 시작\n')

  // 1. 회원가입
  await test('회원가입', async () => {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      email: `test_${Date.now()}@banmo.com`,
      password: 'test1234!',
      nickname: `테스터${Date.now()}`,
      instruments: ['피아노'],
    })
    authToken = res.data.accessToken || res.data.data?.accessToken
    testUserId = res.data.user?.id || res.data.data?.user?.id
    if (!authToken) throw new Error('토큰 없음')
  })

  const authHeader = { headers: { Authorization: `Bearer ${authToken}` } }

  // 2. 로그인
  await test('이메일 로그인', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pianist@banmo.com',
      password: 'test1234!',
    })
    if (!res.data.accessToken && !res.data.data?.accessToken) {
      throw new Error('로그인 실패')
    }
  })

  // 3. 내 정보 조회
  await test('내 정보 조회 (GET /auth/me)', async () => {
    const res = await axios.get(`${BASE_URL}/auth/me`, authHeader)
    if (!res.data.id && !res.data.data?.id) throw new Error('유저 정보 없음')
  })

  // 4. 공고 작성
  await test('공고 작성 (POST /posts)', async () => {
    const res = await axios.post(`${BASE_URL}/posts`, {
      title: '테스트 피아노 반주자 구합니다',
      content: 'CRUD 테스트용 공고입니다',
      category: 'JOB_OFFER',
      instruments: ['피아노'],
      region: '서울 강남구',
      payType: 'HOURLY',
      payMin: 15000,
    }, authHeader)
    testPostId = res.data.id || res.data.data?.id
    if (!testPostId) throw new Error('공고 ID 없음')
  })

  // 5. 공고 목록 조회
  await test('공고 목록 조회 (GET /posts)', async () => {
    const res = await axios.get(`${BASE_URL}/posts`)
    const posts = res.data.data || res.data
    if (!Array.isArray(posts) && !posts.posts && !posts.items) throw new Error('목록 형식 오류')
  })

  // 6. 공고 상세 조회
  await test('공고 상세 조회 (GET /posts/:id)', async () => {
    const res = await axios.get(`${BASE_URL}/posts/${testPostId}`)
    if (!res.data.id && !res.data.data?.id) throw new Error('공고 없음')
  })

  // 7. 공고 수정
  await test('공고 수정 (PATCH /posts/:id)', async () => {
    const res = await axios.patch(`${BASE_URL}/posts/${testPostId}`, {
      title: '수정된 테스트 공고',
    }, authHeader)
    if (!res.data) throw new Error('수정 실패')
  })

  // 8. 자유게시판 글 작성
  await test('자유게시판 글 작성 (POST /board)', async () => {
    const res = await axios.post(`${BASE_URL}/board`, {
      title: '테스트 자유게시판 글',
      content: 'CRUD 테스트용 게시글입니다',
      type: 'FREE',
      isAnonymous: false,
    }, authHeader)
    testBoardId = res.data.id || res.data.data?.id
    if (!testBoardId) throw new Error('게시글 ID 없음')
  })

  // 9. 자유게시판 목록 조회
  await test('자유게시판 목록 조회 (GET /board?type=FREE)', async () => {
    const res = await axios.get(`${BASE_URL}/board?type=FREE`)
    if (!res.data) throw new Error('목록 없음')
  })

  // 10. 익명게시판 글 작성
  await test('익명게시판 글 작성 (POST /board)', async () => {
    const res = await axios.post(`${BASE_URL}/board`, {
      title: '테스트 익명 게시글',
      content: '익명 CRUD 테스트입니다',
      type: 'ANONYMOUS',
      isAnonymous: true,
    }, authHeader)
    if (!res.data.id && !res.data.data?.id) throw new Error('익명 게시글 실패')
  })

  // 11. 댓글 작성
  await test('댓글 작성 (POST /board/:id/comments)', async () => {
    const res = await axios.post(
      `${BASE_URL}/board/${testBoardId}/comments`,
      { content: '테스트 댓글입니다', isAnonymous: false },
      authHeader
    )
    testCommentId = res.data.id || res.data.data?.id
    if (!testCommentId) throw new Error('댓글 ID 없음')
  })

  // 12. 게시글 상세 조회
  await test('게시글 상세 조회 (GET /board/:id)', async () => {
    const res = await axios.get(`${BASE_URL}/board/${testBoardId}`)
    if (!res.data) throw new Error('게시글 없음')
  })

  // 13. 댓글 삭제
  await test('댓글 삭제 (DELETE /board/:id/comments/:cid)', async () => {
    await axios.delete(
      `${BASE_URL}/board/${testBoardId}/comments/${testCommentId}`,
      authHeader
    )
  })

  // 14. 게시글 삭제
  await test('게시글 삭제 (DELETE /board/:id)', async () => {
    await axios.delete(`${BASE_URL}/board/${testBoardId}`, authHeader)
  })

  // 15. 프로필 조회
  await test('프로필 조회 (GET /users/:id)', async () => {
    const res = await axios.get(`${BASE_URL}/users/${testUserId}`, authHeader)
    if (!res.data) throw new Error('프로필 없음')
  })

  // 16. 프로필 수정
  await test('프로필 수정 (PATCH /users/me)', async () => {
    await axios.patch(`${BASE_URL}/users/me`, {
      nickname: '수정된닉네임',
      bio: '테스트 자기소개',
      region: '서울 강남구',
    }, authHeader)
  })

  // 17. 채팅방 생성
  await test('채팅방 생성 (POST /chat/rooms)', async () => {
    const res = await axios.post(`${BASE_URL}/chat/rooms`, {
      postId: testPostId,
      receiverId: testUserId,
    }, authHeader)
    testChatRoomId = res.data.id || res.data.data?.id
  })

  // 18. 채팅방 목록
  await test('채팅방 목록 (GET /chat/rooms)', async () => {
    const res = await axios.get(`${BASE_URL}/chat/rooms`, authHeader)
    if (!res.data) throw new Error('채팅방 목록 없음')
  })

  // 19. QnA 문의 작성
  await test('QnA 문의 작성 (POST /qna)', async () => {
    await axios.post(`${BASE_URL}/qna`, {
      title: '테스트 문의입니다',
      content: 'CRUD 테스트용 문의입니다',
      category: 'GENERAL',
      isPrivate: true,
    }, authHeader)
  })

  // 20. 내 문의 목록
  await test('내 문의 목록 (GET /qna/my)', async () => {
    const res = await axios.get(`${BASE_URL}/qna/my`, authHeader)
    if (!res.data) throw new Error('문의 목록 없음')
  })

  // 21. 즐겨찾기 추가
  await test('즐겨찾기 추가 (POST /favorites)', async () => {
    await axios.post(`${BASE_URL}/favorites`, {
      postId: testPostId,
    }, authHeader)
  })

  // 22. 즐겨찾기 목록
  await test('즐겨찾기 목록 (GET /favorites)', async () => {
    const res = await axios.get(`${BASE_URL}/favorites`, authHeader)
    if (!res.data) throw new Error('즐겨찾기 없음')
  })

  // 23. 알림 목록
  await test('알림 목록 (GET /notifications)', async () => {
    const res = await axios.get(`${BASE_URL}/notifications`, authHeader)
    if (!res.data) throw new Error('알림 없음')
  })

  // 24. 공고 삭제 (마지막에)
  await test('공고 삭제 (DELETE /posts/:id)', async () => {
    await axios.delete(`${BASE_URL}/posts/${testPostId}`, authHeader)
  })

  console.log('\n🎵 테스트 완료!\n')
}

runTests()
