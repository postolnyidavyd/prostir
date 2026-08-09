import styled from 'styled-components';

import RefreshIcon from '../../assets/icons/Refresh.svg?react';
import { formatBookingDay, formatTime, weeklyAdverb } from '../../lib/time';
import type { SeriesSummary } from '../../store/api/bookingsApi';
import { media } from '../../styles/media';
import Button from '../ui/Button';

const Row = styled.article`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.125rem 1.4375rem 1.1875rem 1.6875rem;
  background-color: var(--base-white);
  border: 1px solid var(--base-bright-grey);
  border-radius: 1rem;

  ${media.phone} {
    flex-direction: column;
    align-items: stretch;
    gap: 0.875rem;
    padding: 1rem 1.125rem;
  }
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  min-width: 0;

  ${media.phone} {
    gap: 1rem;
  }
`;

const TimeCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  width: 5.5rem;
  flex-shrink: 0;
`;

const Time = styled.span`
  font-family: 'e-UkraineHead', sans-serif;
  font-weight: 300;
  font-size: 1.1rem;
  line-height: 1.65rem;
  color: var(--primary-black);
`;

const EndLabel = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.75rem;
  line-height: 1.125rem;
  color: var(--grey-100);
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  min-width: 0;
`;

const Title = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 1.1rem;
  line-height: 1.65rem;
  color: var(--primary-black);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.5rem;
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.8125rem;
  line-height: 1.21875rem;
  color: var(--secondary-text);
`;

const Repeat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.1875rem 0.5rem 0.1875rem 0.4375rem;
  border-radius: 999px;
  background-color: var(--accent-color);
  color: var(--accent-color-deep);
  font-size: 0.75rem;

  svg {
    width: 0.8125rem;
    height: 0.8125rem;
  }
`;

const Dot = styled.span`
  color: var(--base-bright-grey);
`;

const Next = styled.span`
  b {
    font-weight: 400;
    color: var(--primary-black);
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;

  ${media.phone} {
    justify-content: space-between;
  }
`;

const Count = styled.span`
  font-family: 'e-Ukraine', sans-serif;
  font-weight: 300;
  font-size: 0.8125rem;
  color: var(--secondary-text);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  b {
    font-family: 'e-UkraineHead', sans-serif;
    font-weight: 400;
    color: var(--primary-black);
  }
`;

type SeriesCardProps = {
  series: SeriesSummary;
  onCancel: () => void;
};

function SeriesCard({ series, onCancel }: SeriesCardProps) {
  const adverb = weeklyAdverb(new Date(series.startsAt));
  const repeatLabel = adverb.charAt(0).toUpperCase() + adverb.slice(1);

  return (
    <Row>
      <Left>
        <TimeCol>
          <Time>{formatTime(series.startsAt)}</Time>
          <EndLabel>до {formatTime(series.endsAt)}</EndLabel>
        </TimeCol>
        <Info>
          <Title>{series.title}</Title>
          <Meta>
            <Repeat>
              <RefreshIcon />
              {repeatLabel}
            </Repeat>
            <span>{series.room.name}</span>
            {series.nextStartsAt && (
              <>
                <Dot>•</Dot>
                <Next>
                  наступне <b>{formatBookingDay(series.nextStartsAt)}</b>
                </Next>
              </>
            )}
          </Meta>
        </Info>
      </Left>

      <Right>
        <Count>
          залишилося <b>{series.upcomingCount}</b> з {series.total}
        </Count>
        <Button
          variant="dangerSoft"
          size="sm"
          onClick={onCancel}
          disabled={series.upcomingCount === 0}
        >
          Скасувати серію
        </Button>
      </Right>
    </Row>
  );
}

export default SeriesCard;
