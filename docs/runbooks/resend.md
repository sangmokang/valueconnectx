# Resend 초대 이메일 런북

## P1: 초대 이메일 미발송

1. Resend Dashboard → Logs에서 발송 상태 확인
2. `RESEND_API_KEY` 환경변수 확인
3. SPF/DKIM/DMARC DNS 레코드 확인:
   ```
   dig TXT valueconnect.kr | grep -E "spf|dkim"
   ```

## P2: 이메일 스팸 분류

- Resend Dashboard → Domains → DNS 설정 재검증
- DMARC 정책 확인 (`p=reject` 권장)

## 초대 이메일 재발송

```bash
# 어드민 패널에서 재발송
# /admin/invites → 해당 초대 → 재발송 버튼
```
