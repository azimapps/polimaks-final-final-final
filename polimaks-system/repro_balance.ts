
import dayjs from 'dayjs';

// Mock Data
const items = [
    { date: '2026-01-01', amount: 100 }, // Yesterday
    { date: '2026-01-02', amount: 50 },  // Today
];

// Helper to simulate component logic
function calculate(startDateStr: string, endDateStr: string) {
    const rangeStart = dayjs(startDateStr).format('YYYY-MM-DD');
    const rangeEnd = dayjs(endDateStr).format('YYYY-MM-DD');
    const dayBeforeStart = dayjs(startDateStr).subtract(1, 'day').format('YYYY-MM-DD');

    const openingBalance = items.reduce((sum, item) => {
        if (item.date <= dayBeforeStart) {
            return sum + item.amount;
        }
        return sum;
    }, 0);

    const rangeNet = items.reduce((sum, item) => {
        if (item.date >= rangeStart && item.date <= rangeEnd) {
            return sum + item.amount;
        }
        return sum;
    }, 0);

    const finalBalance = openingBalance + rangeNet;

    return {
        view: `${rangeStart} to ${rangeEnd}`,
        dayBeforeStart,
        openingBalance,
        rangeNet,
        finalBalance
    };
}

// Scenario 1: View Yesterday (Jan 1)
const yesterday = calculate('2026-01-01', '2026-01-01');

// Scenario 2: View Today (Jan 2)
const today = calculate('2026-01-02', '2026-01-02');

console.log("Yesterday View:", yesterday);
console.log("Today View:", today);

if (yesterday.finalBalance === today.openingBalance) {
    console.log("SUCCESS: Yesterday's Final == Today's Opening");
} else {
    console.log("FAILURE: Yesterday's Final != Today's Opening");
}
