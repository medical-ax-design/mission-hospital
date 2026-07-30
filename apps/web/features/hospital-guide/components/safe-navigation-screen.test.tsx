import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  createGuideFloor,
  mapOnlyRouteFixture,
  verifiedElevatorRouteFixture,
  verifiedEscalatorRouteFixture,
} from '../hospital-guide-test-fixtures';
import { SafeNavigationScreen } from './safe-navigation-screen';

const destination = {
  id: 'main-1f-payment',
  officialNumber: '25',
  officialName: '원무수납/접수',
  aliases: ['원무', '수납'],
  mapX: null,
  mapY: null,
  sourceStatus: 'OFFICIAL_PUBLIC' as const,
};

const floors = [
  {
    ...createGuideFloor('1F', 1),
    mapImageUrl:
      'https://www.samsunghospital.com/_newhome/ui/home/static/img/hospital/guide/main/1F/main-1F-0.jpg',
  },
  {
    ...createGuideFloor('2F', 2),
    mapImageUrl:
      'https://www.samsunghospital.com/_newhome/ui/home/static/img/hospital/guide/main/2F/main-2F-0.jpg',
  },
];

describe('SafeNavigationScreen', () => {
  it('MAP_ONLY에서는 붉은 선과 사용자 애니메이션을 렌더링하지 않는다', () => {
    render(
      <SafeNavigationScreen
        buildingName="본관"
        destination={destination}
        floors={[createGuideFloor('1F', 1)]}
        onBack={vi.fn()}
        route={mapOnlyRouteFixture}
        startFloorCode="1F"
      />,
    );

    expect(screen.queryByTestId('route-line')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('route-user-marker'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('공식 지도에서 위치를 확인하세요'),
    ).toBeInTheDocument();
  });

  it('병원이 검증한 엘리베이터 경로를 층별 선과 전환 화면으로 분리한다', async () => {
    const user = userEvent.setup();

    render(
      <SafeNavigationScreen
        buildingName="본관"
        destination={destination}
        floors={floors}
        onBack={vi.fn()}
        route={verifiedElevatorRouteFixture}
        startFloorCode="1F"
      />,
    );

    expect(
      screen.getByText('현재 위치에서 엘리베이터 입구까지'),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('route-line')).toHaveLength(1);

    await user.click(
      screen.getByRole('button', {
        name: '이동 수단에 도착했어요',
      }),
    );
    expect(screen.getByText('1층 → 2층')).toBeInTheDocument();
    expect(screen.queryByTestId('route-line')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '2층에 도착했어요' }),
    );
    expect(
      screen.getByText('엘리베이터 출구에서 목적지까지'),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('route-line')).toHaveLength(1);
  });

  it('병원이 검증한 에스컬레이터 경로도 입구와 출구에서 선을 끊는다', async () => {
    const user = userEvent.setup();

    render(
      <SafeNavigationScreen
        buildingName="본관"
        destination={destination}
        floors={floors}
        onBack={vi.fn()}
        route={verifiedEscalatorRouteFixture}
        startFloorCode="1F"
      />,
    );

    expect(
      screen.getByText('현재 위치에서 에스컬레이터 입구까지'),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: '이동 수단에 도착했어요',
      }),
    );
    expect(screen.getByText('에스컬레이터로 올라가세요')).toBeInTheDocument();
    expect(screen.queryByTestId('route-line')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: '2층에 도착했어요' }),
    );
    expect(
      screen.getByText('에스컬레이터 출구에서 목적지까지'),
    ).toBeInTheDocument();
  });
});
