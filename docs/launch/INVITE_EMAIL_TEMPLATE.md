# ValueConnect X — 초대 이메일 템플릿

> **용도**: Phase 1 런칭 시 초대받은 인재에게 발송할 이메일 본문
> **언어**: 한국어
> **톤**: 신뢰감 + 우대감 (Private Talent Network)
> **금지 단어**: 수수료, 25%, fee, 성사, 성공보수 등 수익 모델 노출 단어 일체
> **상위 원칙**: `CLAUDE.md` §1 Product North Star, §3.0 사용자 승인 카피 불가침

---

## 1. 발송 메타

| 항목 | 내용 |
|---|---|
| 발송 도메인 | `valueconnect.kr` (Resend 자체 인프라, ADR-0009) |
| 발신자 표기 | `ValueConnect X <invite@valueconnect.kr>` |
| Reply-To | `dev@valueconnect.kr` (운영 응대) |
| 제목 후보 A | `{{초대자_이름}}님이 ValueConnect X로 초대했습니다` |
| 제목 후보 B | `초대장 — ValueConnect X에서 만나뵙고 싶습니다` |
| 제목 후보 C | `{{초대자_이름}}님이 같은 자리에 모이고 싶어 하는 분이 있습니다` |
| Magic Link 유효 기간 | 발송 후 7일 (초대 1회 사용) |

> 제목은 A/B/C 중 하나를 운영팀이 선택. 기본 추천: **A**.

---

## 2. 이메일 본문 (HTML/Plain 공용 카피)

### Plain Text 버전

```
{{받는사람_이름}}님,

ValueConnect X에 초대받으셨습니다.

ValueConnect X는 초대받은 분들만 모이는 사적인 네트워크입니다.
공개 채널에서는 만나기 어려운 분들이, 자신의 결을 잃지 않은 채로
서로를 알아보고 다음 챕터를 함께 그려가는 공간을 지향합니다.

{{초대자_이름}}님은 이 자리에 {{받는사람_이름}}님이 함께하시면
좋겠다고 생각하셨습니다.

이곳에서 만나실 수 있는 것들:

  · 큐레이션 피드 — 관심 분야의 시장 흐름을 매주 정돈된 형태로
  · 커뮤니티 라운지 — 익명이 만드는 솔직한 대화
  · CEO 커피챗 — 공개 정보로 알 수 없는 결을 확인하는 자리
  · 멤버 커피챗 — 같은 고도에서 만나는 동료와의 느슨한 연결
  · 멤버 디렉토리 — 검증된 동료들의 풍경

아래 링크로 입장하실 수 있습니다. 별도 비밀번호는 필요하지 않습니다.
링크를 클릭하시면 메일 주소로 매직 링크가 한 번 더 전달됩니다.

▶ 입장하기
{{INVITE_ACCEPT_URL}}

이 링크는 발송 후 7일간 유효하며, {{받는사람_이메일}} 주소로만
사용하실 수 있습니다.

이 자리는 의무가 아닙니다. 받지 않으셔도 괜찮습니다.
다만, 한 번 들어오시면 적어도 한 분과는 결이 맞는 만남이
있으리라 믿습니다.

기다리고 있겠습니다.

— ValueConnect X 운영팀
   dev@valueconnect.kr

---
이 메일은 {{초대자_이름}}님이 직접 보낸 초대장에 따라
{{받는사람_이메일}} 앞으로 1회 발송되었습니다.
초대 의도와 무관하게 받으셨다면 답장 한 줄로 알려주십시오.
즉시 정리해 드리겠습니다.
```

---

### HTML 버전 (구조 가이드)

```html
<!-- 본문 폭: 600px 고정, 모바일 가독성 우선 -->
<table width="600" cellpadding="0" cellspacing="0" style="background:#f5f0e8;font-family:'Noto Serif KR',Georgia,serif;color:#1a1a1a;">
  <tr><td style="padding:40px 32px 24px;">

    <div style="font-size:12px;letter-spacing:0.18em;color:#b8902a;text-transform:uppercase;">
      VALUECONNECT X · 초대장
    </div>

    <h1 style="margin:24px 0 0;font-size:26px;line-height:1.35;color:#1a1a1a;">
      {{받는사람_이름}}님,<br/>
      함께 하실 자리가 있습니다.
    </h1>

    <p style="margin:24px 0 0;font-size:15px;line-height:1.85;color:#555;">
      ValueConnect X는 초대받은 분들만 모이는 사적인 네트워크입니다.
      공개 채널에서는 만나기 어려운 분들이, 자신의 결을 잃지 않은 채로
      서로를 알아보고 다음 챕터를 함께 그려가는 공간을 지향합니다.
    </p>

    <p style="margin:20px 0 0;font-size:15px;line-height:1.85;color:#555;">
      <strong style="color:#1a1a1a;">{{초대자_이름}}</strong>님은 이 자리에
      {{받는사람_이름}}님이 함께하시면 좋겠다고 생각하셨습니다.
    </p>

    <!-- 6 Pillar 요약 (border-radius:0 정책 유지) -->
    <div style="margin:32px 0 0;border-top:1px solid #ebe5da;border-bottom:1px solid #ebe5da;padding:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.8;color:#555;">
        <tr><td style="padding:4px 0;"><strong style="color:#1a1a1a;">큐레이션 피드</strong> — 관심 분야의 시장 흐름을 매주 정돈된 형태로</td></tr>
        <tr><td style="padding:4px 0;"><strong style="color:#1a1a1a;">커뮤니티 라운지</strong> — 익명이 만드는 솔직한 대화</td></tr>
        <tr><td style="padding:4px 0;"><strong style="color:#1a1a1a;">CEO 커피챗</strong> — 공개 정보로 알 수 없는 결을 확인하는 자리</td></tr>
        <tr><td style="padding:4px 0;"><strong style="color:#1a1a1a;">멤버 커피챗</strong> — 같은 고도에서 만나는 느슨한 연결</td></tr>
        <tr><td style="padding:4px 0;"><strong style="color:#1a1a1a;">멤버 디렉토리</strong> — 검증된 동료들의 풍경</td></tr>
      </table>
    </div>

    <!-- CTA: 각진 버튼 (border-radius:0) -->
    <table cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
      <tr><td style="background:#c9a84c;">
        <a href="{{INVITE_ACCEPT_URL}}"
           style="display:inline-block;padding:16px 32px;font-size:15px;font-weight:700;color:#1a1a1a;text-decoration:none;letter-spacing:0.04em;">
          입장하기 →
        </a>
      </td></tr>
    </table>

    <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#888;">
      이 링크는 발송 후 7일간 유효하며, {{받는사람_이메일}} 주소로만
      사용하실 수 있습니다. 별도 비밀번호는 필요하지 않습니다.
    </p>

    <p style="margin:32px 0 0;font-size:14px;line-height:1.85;color:#555;font-style:italic;">
      이 자리는 의무가 아닙니다. 받지 않으셔도 괜찮습니다.<br/>
      다만, 한 번 들어오시면 적어도 한 분과는 결이 맞는 만남이
      있으리라 믿습니다.
    </p>

    <p style="margin:32px 0 0;font-size:14px;color:#555;">
      기다리고 있겠습니다.<br/><br/>
      — ValueConnect X 운영팀<br/>
      <a href="mailto:dev@valueconnect.kr" style="color:#b8902a;">dev@valueconnect.kr</a>
    </p>

  </td></tr>

  <tr><td style="padding:24px 32px 40px;border-top:1px solid #ebe5da;">
    <p style="margin:0;font-size:11px;line-height:1.7;color:#888;">
      이 메일은 {{초대자_이름}}님이 직접 보낸 초대장에 따라
      {{받는사람_이메일}} 앞으로 1회 발송되었습니다.
      초대 의도와 무관하게 받으셨다면 답장 한 줄로 알려주십시오.
      즉시 정리해 드리겠습니다.
    </p>
  </td></tr>
</table>
```

---

## 3. 변수 정의

| 변수 | 출처 | 예시 |
|---|---|---|
| `{{받는사람_이름}}` | `vcx_invitations.invitee_name` | "강상모" |
| `{{받는사람_이메일}}` | `vcx_invitations.invitee_email` | "guest@example.com" |
| `{{초대자_이름}}` | inviter profile `display_name` | "홍길동" |
| `{{INVITE_ACCEPT_URL}}` | `${SITE_URL}/invite/accept?token=${TOKEN}` | `https://valueconnect.kr/invite/accept?token=...` |

> 변수 치환은 발송 직전 서버 측에서 처리. 미치환 변수가 본문에 남으면 발송 차단.

---

## 4. QA 체크리스트 (발송 전)

- [ ] 본문에 "수수료", "25%", "fee", "성사", "성공보수" 단어 0건 (`scripts/check-fee-hidden.sh` 발송 본문에도 적용)
- [ ] 모든 사용자 노출 텍스트 한국어
- [ ] `border-radius: 0` 유지 (HTML 버튼 모서리)
- [ ] Galaxy 360px 폭에서 줄바꿈 정상
- [ ] Magic Link 클릭 → `/invite/accept` 리다이렉트 → `/login` → `/onboarding` → `/directory` 체인 정상
- [ ] Reply-To가 `dev@valueconnect.kr`로 설정됨
- [ ] 발송 도메인 SPF/DKIM/DMARC 통과 (Resend 콘솔 확인)
- [ ] 동일 토큰 재사용 시 차단 처리(`vcx_consume_invite` RPC)
- [ ] 만료 7일 이후 클릭 시 정중한 만료 안내 페이지로 이동

---

## 5. 발송 운영 메모

- **개인화**: `{{초대자_이름}}` 이외에 자동화된 개인화 카피는 Phase 1에서 도입하지 않음. 의도적인 절제.
- **재발송 정책**: 동일 인물에게 동일 초대자가 보낼 수 있는 횟수 1회. 운영팀 수동 발송으로만 재발송.
- **수신 거부**: 초대 1회 발송이므로 별도 unsubscribe 푸터 없음. 단, 답장으로 정리 요청 시 즉시 처리.
- **관측**: 발송 → 클릭 → 수락 → 온보딩 완료의 4단계 funnel을 운영팀 시트에 기록 (Phase 1 수동, Phase 2 자동화 검토).
