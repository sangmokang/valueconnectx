# VCX Orchestrator

프로젝트 전체 코드 구조를 제어하고 리포팅하는 시스템.

## 목적

1. **구조 제어**: 코드 구조 규칙 정의 및 위반 탐지
2. **리포팅**: 프로젝트 상태 자동 리포트 생성
3. **의존성 관리**: 모듈 간 의존성 추적
4. **품질 게이트**: 빌드/린트/테스트 상태 모니터링

## 구성 요소

| 파일 | 역할 |
|------|------|
| `scripts/orchestrator.sh` | 프로젝트 리포트 생성 CLI |
| `wiki/orchestrator/rules.md` | 코드 구조 규칙 |
| `wiki/orchestrator/report-template.md` | 리포트 템플릿 |
| `wiki/orchestrator/health-checklist.md` | 배포 전 체크리스트 |

## 사용법

```bash
# 전체 프로젝트 리포트 생성
./scripts/orchestrator.sh report

# 구조 규칙 검증
./scripts/orchestrator.sh check

# 모듈 통계
./scripts/orchestrator.sh stats

# 리포트를 wiki에 저장
./scripts/orchestrator.sh report --save
```

## 리포트 항목

- 📊 **파일 통계**: 도메인별 파일 수, 코드 라인 수
- 🔗 **API 커버리지**: 라우트 핸들러 수, 테스트 커버리지
- 🏗️ **구조 규칙 준수**: 위반 사항 목록
- 📦 **의존성 상태**: 패키지 버전, 보안 취약점
- 🔄 **마이그레이션 상태**: DB 마이그레이션 현황
- ✅ **빌드/린트/테스트**: 품질 게이트 결과
