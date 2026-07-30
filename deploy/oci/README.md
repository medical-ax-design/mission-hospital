# OCI API 배포

Wait:ON API를 OCI ARM64 인스턴스에서 Docker Compose로 실행하고
Caddy가 HTTPS를 종료한다. 실제 인프라 값은 이 디렉터리의 `.env`에만
저장하며 Git에는 커밋하지 않는다.

## 구성

```text
Internet :443
→ Caddy
→ Docker 내부 네트워크 :3001
→ NestJS API
```

호스트의 `3001` 포트는 공개하지 않는다. OCI Security List와
호스트 방화벽은 SSH, HTTP, HTTPS만 허용한다. Caddy 설정 bind
mount에는 Oracle Linux의 SELinux 강제 모드에 맞는 전용 라벨을
적용한다.

## 서버 환경변수

```bash
cp deploy/oci/.env.example deploy/oci/.env
chmod 600 deploy/oci/.env
```

- `API_HOST`: Caddy가 인증서를 발급할 공개 API 호스트명
- `WEB_ORIGIN`: 브라우저 요청을 허용할 Vercel 운영 Origin

`WEB_ORIGIN`에는 경로나 끝 슬래시를 넣지 않는다. Vercel Preview를
허용하려면 임의 와일드카드를 사용하지 말고 승인된 Preview Origin
목록을 지원하도록 API 계약을 먼저 확장한다.

## 배포

저장소 루트에서 실행한다.

```bash
docker compose --env-file deploy/oci/.env \
  -f deploy/oci/compose.yaml up -d --build
```

상태와 로그를 확인한다.

```bash
docker compose --env-file deploy/oci/.env \
  -f deploy/oci/compose.yaml ps
docker compose --env-file deploy/oci/.env \
  -f deploy/oci/compose.yaml logs --tail=100 api caddy
curl --fail --silent --show-error \
  "https://${API_HOST}/health/ready"
```

## 갱신과 롤백

새 소스를 같은 경로에 배치한 뒤 이미지를 다시 빌드한다.

```bash
docker compose --env-file deploy/oci/.env \
  -f deploy/oci/compose.yaml up -d --build
```

롤백은 검증된 이전 Git archive를 다시 배치하고 같은 명령을 실행한다.
Caddy 인증서와 설정 데이터는 Docker named volume에 유지된다.

## 비밀정보 경계

다음 값은 저장소, PR, 빌드 로그에 넣지 않는다.

- SSH 개인키
- OCI OCID와 API 키
- 실제 공인 IP와 운영 Origin
- Vercel 토큰
- Supabase 또는 PostgreSQL 접속 문자열
