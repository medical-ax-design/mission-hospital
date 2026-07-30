# 근거 자료

## 1. 사용 원칙

- 의료 콘텐츠는 병원 공식 자료를 우선한다.
- 기술 선택은 제품 공식 문서를 우선한다.
- 공개 웹 안내는 실제 운영 지침의 원본이 아니라 프로토타입 구조 참고자료다.
- 실제 도입 시 병원이 제공한 최신 승인 문서와 내부 코드 체계로 교체한다.

## 2. 삼성서울병원 규모와 환자 구성

- [삼성서울병원 병원 현황](https://www.samsunghospital.com/home/info/hosptStatus.do)
- [Samsung Medical Center Annual Report](https://www.samsunghospital.com/en/assets/files/about-smc/SMC_AnnualReport.pdf)
- [삼성서울병원 ESG 보고서](https://www.samsunghospital.com/home/info/esgReport.do)
- [암병원 의료질 평가 보고서](https://www.samsunghospital.com/home/cancer/intro.do?view=OUTCOMES)

Annual Report는 전체 외래·입원, 진료과별 환자, 성별·연령, 병상 가동률과 수술 통계를 확인하는 데 사용한다. 센터별 Outcomes Report는 질환·시술·수술별 세부 성과를 확인하는 데 사용한다.

## 3. 검사·수술 준비 안내 사례

- [CT 검사 안내](https://www.samsunghospital.com/dept/medical/healthSub04View.do?DP_CODE=BR&MENU_ID=003&content_id=170&ds_code=D0003873&main_content_id=688)
- [뇌 CT 검사 안내](https://www.samsunghospital.com/dept/main/index.do?DP_CODE=PSC&MENU_ID=004018)
- [뇌혈관 CT 검사 안내](https://www.samsunghospital.com/dept/main/index.do?DP_CODE=PSC&MENU_ID=004019)
- [뇌 MRI/MRA 검사 안내](https://www.samsunghospital.com/dept/main/index.do?DP_CODE=PSC&MENU_ID=004020)
- [경동맥초음파 검사 안내](https://www.samsunghospital.com/dept/main/index.do?DP_CODE=PSC&MENU_ID=004022)
- [오전 대장내시경 준비 안내](https://www.samsunghospital.com/mobile/colonoscopy/method_01.html)
- [오후 대장내시경 준비 안내](https://www.samsunghospital.com/mobile/colonoscopy/method_02.html)
- [대장암 수술 과정](https://www.samsunghospital.com/dept/medical/healthSub02View.do?DP_CODE=RT&content_id=1202)
- [수술 전 간호 안내](https://www.samsunghospital.com/dept/main/index.do?DP_CODE=FS&MENU_ID=005005)

같은 CT도 조영제, 부위와 프로토콜에 따라 금식 조건이 다르다. 이 차이가 Procedure와 승인 프로토콜을 분리하고 범용 의료 규칙을 생성하지 않는 설계의 근거다.

현재 오전 대장내시경 제한 데모는 위 링크의 `오전 대장내시경 준비
안내`를 2026-07-30에 확인해 짧은 구조화 데이터로 재작성했다.
원문 전체를 복제하지 않으며 실제 도입 시 병원 내부 최신 승인본과
콘텐츠 사용 승인이 필요하다.

## 4. Supabase

- [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Connect to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [JWT](https://supabase.com/docs/guides/auth/jwts)
- [Postgres SSL Enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement)

## 5. Vercel

- [Deploying to Vercel](https://vercel.com/docs/deployments/overview)
- [Environment Variables](https://vercel.com/docs/environment-variables)

## 6. Oracle Cloud Infrastructure

- [OCI Compute Overview](https://docs.oracle.com/en-us/iaas/Content/Compute/Concepts/computeoverview.htm)
- [OCI Container Instances Overview](https://docs.oracle.com/en-us/iaas/Content/container-instances/overview-of-container-instances.htm)
