import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import subDays from 'date-fns/subDays';
import addDays from 'date-fns/addDays';
import setDate from 'date-fns/setDate';
import endOfMonth from 'date-fns/endOfMonth';
import setMonth from 'date-fns/setMonth';
import addMonths from 'date-fns/addMonths';
import endOfYear from 'date-fns/endOfYear';
import subMonths from 'date-fns/subMonths';
import { act } from 'react-dom/test-utils';
import { monthName, MONTHS } from './utils';
import { View, SelectorView } from './typings';

import { Calendar } from './index';

jest.useFakeTimers();

describe('Calendar', () => {
    const defaultDate = new Date('November 30, 2020 00:00:00');
    const defaultValue = defaultDate.getTime();
    const defaultDateOfMonth = defaultDate.getDate().toString();
    const defaultMonth = monthName(defaultDate).toString();
    const defaultYear = defaultDate.getFullYear().toString();

    const waitForTransition = () =>
        act(() => {
            jest.advanceTimersByTime(300);
        });

    describe('Display tests', () => {
        it('should match snapshot', () => {
            expect(render(<Calendar value={defaultValue} />).container).toMatchSnapshot();
        });

        it.each(['days', 'months', 'years'])('should match defaultView="%s" snapshot', (view) => {
            expect(
                render(
                    <Calendar
                        value={defaultValue}
                        maxDate={endOfYear(defaultValue).getTime()}
                        defaultView={view as View}
                    />,
                ).container,
            ).toMatchSnapshot();
        });

        it.each(['month-only', 'full'])('should match selectorView="%s" snapshot', (view) => {
            expect(
                render(<Calendar value={defaultValue} selectorView={view as SelectorView} />)
                    .container,
            ).toMatchSnapshot();
        });
    });

    it('should set `data-test-id` attribute', () => {
        const testId = 'test-id';
        const { getByTestId } = render(<Calendar dataTestId={testId} />);

        expect(getByTestId(testId)).toBeInTheDocument();
    });

    it('should set custom class', () => {
        const className = 'custom-class';
        const { container } = render(<Calendar className={className} />);

        expect(container.firstElementChild).toHaveClass(className);
    });

    it('should open current month by default', () => {
        const { queryByText } = render(<Calendar />);

        const now = new Date();
        const currentDate = now.getDate().toString();
        const currentMonth = monthName(now).toString();
        const currentYear = now.getFullYear().toString();

        expect(queryByText(currentYear)).toBeInTheDocument();
        expect(queryByText(currentMonth)).toBeInTheDocument();
        expect(queryByText(currentDate)).toBeInTheDocument();
    });

    it('should open month passed by defaultMonth', () => {
        const { queryByText } = render(<Calendar defaultMonth={defaultDate.getTime()} />);

        expect(queryByText(defaultYear)).toBeInTheDocument();
        expect(queryByText(defaultMonth)).toBeInTheDocument();
        expect(queryByText(defaultDateOfMonth)).toBeInTheDocument();
    });

    it('should limit defaultMonth by min/max dates', () => {
        const { queryByText, rerender } = render(
            <Calendar
                defaultMonth={defaultDate.getTime()}
                minDate={addMonths(defaultDate.getTime(), 1).getTime()}
            />,
        );

        expect(queryByText('Декабрь')).toBeInTheDocument();

        rerender(
            <Calendar
                defaultMonth={defaultDate.getTime()}
                maxDate={subMonths(defaultDate.getTime(), 1).getTime()}
                key='2'
            />,
        );

        expect(queryByText('Октябрь')).toBeInTheDocument();
    });

    it('should open month of date passed by value', () => {
        const { queryByText, rerender } = render(<Calendar value={defaultValue} />);

        expect(queryByText(defaultYear)).toBeInTheDocument();
        expect(queryByText(defaultMonth)).toBeInTheDocument();
        expect(queryByText(defaultDateOfMonth)).toBeInTheDocument();

        rerender(<Calendar value={addMonths(defaultValue, 1).getTime()} />);

        expect(queryByText(MONTHS[defaultDate.getMonth() + 1])).toBeInTheDocument();
    });

    it('should open month passed by month', () => {
        const { queryByText, rerender } = render(<Calendar month={defaultValue} />);

        expect(queryByText(defaultYear)).toBeInTheDocument();
        expect(queryByText(defaultMonth)).toBeInTheDocument();
        expect(queryByText(defaultDateOfMonth)).toBeInTheDocument();

        rerender(<Calendar month={addMonths(defaultValue, 1).getTime()} />);

        expect(queryByText(MONTHS[defaultDate.getMonth() + 1])).toBeInTheDocument();
    });

    describe('when minDate is set', () => {
        it('should disable all days before minDate', async () => {
            const prevMonthMinDate = subDays(defaultDate, 30).getTime();

            const { container, getByLabelText } = render(
                <Calendar
                    value={defaultValue}
                    minDate={prevMonthMinDate}
                    selectorView='month-only'
                />,
            );

            expect(container.querySelectorAll('table button:disabled')).toHaveLength(0);

            fireEvent.click(getByLabelText('Предыдущий период'));

            const nonDisabledDays = container.querySelectorAll('table button:not(:disabled)');

            expect(nonDisabledDays[0]).not.toBeDisabled();
            expect(nonDisabledDays[0]).toHaveTextContent('31');
        });

        it('should hide prev arrow if min date in active month', async () => {
            const currentMonthMinDate = subDays(defaultDate, 10).getTime();
            const prevMonthMinDate = subDays(defaultDate, 30).getTime();

            const { queryByLabelText, rerender } = render(
                <Calendar
                    value={defaultValue}
                    minDate={currentMonthMinDate}
                    selectorView='month-only'
                />,
            );

            const prevMonthButton = () => queryByLabelText('Предыдущий период') as HTMLElement;

            expect(prevMonthButton()).not.toBeInTheDocument();

            rerender(
                <Calendar
                    value={defaultValue}
                    minDate={prevMonthMinDate}
                    selectorView='month-only'
                />,
            );

            expect(prevMonthButton()).toBeInTheDocument();

            fireEvent.click(prevMonthButton());

            expect(prevMonthButton()).not.toBeInTheDocument();
        });

        it('should disable previous months', async () => {
            const prevMonthMinDate = subDays(defaultDate, 40).getTime();

            const { getByText, container } = render(
                <Calendar value={defaultValue} minDate={prevMonthMinDate} />,
            );

            fireEvent.click(getByText('Ноябрь'));

            const months = container.querySelectorAll('button[data-date]');

            Array.from(months).forEach((monthButton, i) => {
                if (i < MONTHS.indexOf('Октябрь')) {
                    expect(monthButton).toBeDisabled();
                } else {
                    expect(monthButton).not.toBeDisabled();
                }
            });
        });

        it('should not show previous years', async () => {
            const prevYearMinDate = subDays(defaultDate, 365).getTime();

            const { getByText, container } = render(
                <Calendar value={defaultValue} minDate={prevYearMinDate} />,
            );

            fireEvent.click(getByText('2020'));

            const years = container.querySelectorAll('button[data-date]');

            expect(years[years.length - 1]).toHaveTextContent('2019');
        });
    });

    describe('when maxDate is set', () => {
        it('should disable all days after maxDate', async () => {
            const maxDate = addDays(defaultDate, 10).getTime();
            const { container, getByLabelText } = render(
                <Calendar value={defaultValue} maxDate={maxDate} selectorView='month-only' />,
            );

            expect(container.querySelectorAll('table button:disabled')).toHaveLength(0);

            fireEvent.click(getByLabelText('Следующий период'));

            waitForTransition();

            const nonDisabledDays = container.querySelectorAll('table button:not(:disabled)');
            const lastNonDisabledDay = nonDisabledDays[nonDisabledDays.length - 1];

            expect(lastNonDisabledDay).not.toBeDisabled();
            expect(lastNonDisabledDay).toHaveTextContent('10');
        });

        it('should hide next arrow if max date in active month', async () => {
            const maxDate = addDays(defaultDate, 10).getTime();

            const { queryByLabelText } = render(
                <Calendar value={defaultValue} maxDate={maxDate} selectorView='month-only' />,
            );

            const nextMonthButton = () => queryByLabelText('Следующий период') as HTMLElement;

            expect(nextMonthButton()).toBeInTheDocument();

            fireEvent.click(nextMonthButton());

            expect(nextMonthButton()).not.toBeInTheDocument();
        });

        it('should disable next months', async () => {
            const nextYearDate = addDays(defaultDate, 32);

            const { getByText, container } = render(
                <Calendar
                    value={defaultValue}
                    maxDate={nextYearDate.getTime()}
                    selectorView='full'
                />,
            );

            fireEvent.click(getByText('Ноябрь'));

            expect(container.querySelectorAll('button[data-date]:disabled')).toHaveLength(0);

            fireEvent.click(getByText(defaultDate.getFullYear().toString()));

            fireEvent.click(getByText(nextYearDate.getFullYear().toString()));

            waitForTransition();

            fireEvent.click(getByText('Январь'));

            expect(container.querySelectorAll('button[data-date]:not(:disabled)')).toHaveLength(1);
        });
    });

    describe('when selectedFrom is set', () => {
        it('should highlights days between selectedFrom and hovered date (hovered > selectedFrom)', () => {
            const selectedDay = 15;
            const highlightedDay = 20;

            const selectedFrom = setDate(defaultValue, selectedDay);
            const highlightedDate = setDate(defaultValue, highlightedDay);

            const { container } = render(
                <Calendar defaultMonth={defaultValue} selectedFrom={selectedFrom.getTime()} />,
            );

            const days = container.querySelectorAll('td[data-date] button');

            expect(days).toHaveLength(30);

            fireEvent.mouseEnter(days[highlightedDate.getDate() - 1]);

            days.forEach((day) => {
                const date = +(day.textContent || '');

                if (date < selectedDay || date > highlightedDay) {
                    expect(day).not.toHaveClass('highlighted');
                    expect(day.parentElement).not.toHaveClass('range');
                    return;
                }

                if (date === selectedDay) {
                    expect(day.parentElement).toHaveClass('rangeStart');
                    expect(day).toHaveClass('selected');
                    return;
                }

                if (date === highlightedDay) {
                    expect(day).toHaveClass('highlighted');
                    return;
                }

                expect(day.parentElement).toHaveClass('range');
            });
        });

        it('should highlights days between hovered and selectedFrom date (hovered < selectedFrom)', () => {
            const selectedDay = 20;
            const highlightedDay = 15;

            const selectedFrom = setDate(defaultValue, selectedDay);
            const highlightedDate = setDate(defaultValue, highlightedDay);

            const { container } = render(
                <Calendar defaultMonth={defaultValue} selectedFrom={selectedFrom.getTime()} />,
            );

            const days = container.querySelectorAll('td[data-date] button');

            expect(days).toHaveLength(30);

            fireEvent.mouseEnter(days[highlightedDate.getDate() - 1]);

            days.forEach((day) => {
                const date = +(day.textContent || '');

                if (date < highlightedDay || date > selectedDay) {
                    expect(day).not.toHaveClass('highlighted');
                    expect(day.parentElement).not.toHaveClass('range');
                    return;
                }

                if (date === selectedDay) {
                    expect(day).toHaveClass('selected');
                    return;
                }

                if (date === highlightedDay) {
                    expect(day.parentElement).toHaveClass('rangeStart');
                    expect(day).toHaveClass('highlighted');
                    return;
                }

                expect(day.parentElement).toHaveClass('range');
            });
        });
    });

    describe('when only selectedTo is set', () => {
        it('should highlight days between selectedTo and hightlighted', () => {
            const selectedDay = 15;
            const highlightedDay = 20;

            const selectedTo = setDate(defaultValue, selectedDay);
            const highlightedDate = setDate(defaultValue, highlightedDay);

            const { container } = render(
                <Calendar defaultMonth={defaultValue} selectedTo={selectedTo.getTime()} />,
            );

            const days = container.querySelectorAll('td[data-date] button');

            expect(days).toHaveLength(30);

            fireEvent.mouseEnter(days[highlightedDate.getDate() - 1]);

            days.forEach((day) => {
                const date = +(day.textContent || '');

                if (date < selectedDay || date > highlightedDay) {
                    expect(day).not.toHaveClass('highlighted');
                    expect(day.parentElement).not.toHaveClass('range');
                    return;
                }

                if (date === selectedDay) {
                    expect(day.parentElement).toHaveClass('rangeStart');
                    expect(day).toHaveClass('selected');
                    return;
                }

                expect(day.parentElement).toHaveClass('range');
            });
        });
    });

    describe('when selectedFrom and selectedTo are set', () => {
        it('should highlight days between selectedFrom and selectedTo', () => {
            const fromDay = 15;
            const toDay = 20;
            const highlightedDay = 17;

            const selectedFrom = setDate(defaultValue, fromDay);
            const selectedTo = setDate(defaultValue, toDay);

            const { container } = render(
                <Calendar
                    defaultMonth={defaultValue}
                    selectedTo={selectedTo.getTime()}
                    selectedFrom={selectedFrom.getTime()}
                />,
            );

            const days = container.querySelectorAll('td[data-date] button');

            expect(days).toHaveLength(30);

            fireEvent.mouseEnter(days[highlightedDay - 1]);

            days.forEach((day) => {
                const date = +(day.textContent || '');

                if (date < fromDay || date > toDay) {
                    expect(day).not.toHaveClass('highlighted');
                    expect(day.parentElement).not.toHaveClass('range');
                    return;
                }

                if (date === fromDay) {
                    expect(day.parentElement).toHaveClass('rangeStart');
                    return;
                }

                if (date === toDay) {
                    expect(day).toHaveClass('selected');
                    return;
                }

                if (date === highlightedDay) {
                    expect(day).toHaveClass('highlighted');
                }

                expect(day.parentElement).toHaveClass('range');
            });
        });
    });

    describe('when selectedFrom and selectedTo are in different months', () => {
        it('should set transitRight class to last day of selectedFrom month', () => {
            const selectedFrom = setDate(defaultValue, 20);
            const selectedTo = addDays(defaultValue, 10);

            const { container } = render(
                <Calendar
                    defaultMonth={defaultValue}
                    selectedTo={selectedTo.getTime()}
                    selectedFrom={selectedFrom.getTime()}
                />,
            );

            const days = container.querySelectorAll('td[data-date]');

            expect(days[days.length - 1]).toHaveClass('transitRight');
        });

        it('should set transitLeft class to first day of selectedTo month', async () => {
            const selectedFrom = setDate(defaultValue, 20);
            const selectedTo = addDays(defaultValue, 10);

            const { container, getByLabelText } = render(
                <Calendar
                    defaultMonth={defaultValue}
                    selectedTo={selectedTo.getTime()}
                    selectedFrom={selectedFrom.getTime()}
                    selectorView='month-only'
                />,
            );

            fireEvent.click(getByLabelText('Следующий период'));

            const days = container.querySelectorAll('td[data-date]');

            expect(days[0]).toHaveClass('transitLeft');
        });
    });

    it('should set offDays', () => {
        const offDays = [
            setDate(defaultDate, 10),
            setDate(defaultDate, 1),
            setDate(defaultDate, 22),
        ];

        const { queryByText } = render(<Calendar value={defaultValue} offDays={offDays} />);

        offDays.forEach((day) => {
            const dayOfMonth = day.getDate().toString();
            expect(queryByText(dayOfMonth)?.parentNode).toBeDisabled();
        });
    });

    it('should set events', () => {
        const events = [
            setDate(defaultDate, 10),
            setDate(defaultDate, 1),
            setDate(defaultDate, 22),
        ];

        const { queryByText } = render(<Calendar value={defaultValue} events={events} />);

        events.forEach((day) => {
            const dayOfMonth = day.getDate().toString();
            expect(queryByText(dayOfMonth)?.firstElementChild).toHaveClass('dot');
        });
    });

    describe('Callback tests', () => {
        it('should call onChange callback', () => {
            const cb = jest.fn();
            const { getByText } = render(<Calendar onChange={cb} />);

            fireEvent.click(getByText('10'));

            expect(cb).toBeCalledTimes(1);
        });

        it('should call onMonthChange callback in full view', async () => {
            const cb = jest.fn();
            const { getByText } = render(
                <Calendar
                    defaultMonth={defaultDate.getTime()}
                    onMonthChange={cb}
                    selectorView='full'
                />,
            );

            // открытие
            fireEvent.click(getByText('Ноябрь'));

            // изменение
            fireEvent.click(getByText('Октябрь'));

            fireEvent.click(getByText('2020'));

            fireEvent.click(getByText('2019'));

            expect(cb).toBeCalledTimes(2);
        });

        it('should call onMonthChange callback in month-only view', () => {
            const cb = jest.fn();
            const { getByLabelText } = render(
                <Calendar
                    defaultMonth={defaultDate.getTime()}
                    onMonthChange={cb}
                    selectorView='month-only'
                />,
            );

            fireEvent.click(getByLabelText('Следующий период'));
            fireEvent.click(getByLabelText('Предыдущий период'));

            expect(cb).toBeCalledTimes(2);
        });

        it('should call onMonthClick callback in full view', () => {
            const cb = jest.fn();
            const { getByText } = render(
                <Calendar
                    defaultMonth={defaultDate.getTime()}
                    onMonthClick={cb}
                    selectorView='full'
                />,
            );

            fireEvent.click(getByText('Ноябрь'));
            expect(cb).toBeCalledTimes(1);
        });

        it('should call onYearClick callback in full view', () => {
            const cb = jest.fn();
            const { getByText } = render(
                <Calendar
                    defaultMonth={defaultDate.getTime()}
                    onYearClick={cb}
                    selectorView='full'
                />,
            );

            fireEvent.click(getByText('2020'));
            expect(cb).toBeCalledTimes(1);
        });
    });

    describe('Keyboard control', () => {
        const keyCodes = {
            PageUp: 33,
            PageDown: 34,
            End: 35,
            Home: 36,
            ArrowLeft: 37,
            ArrowUp: 38,
            ArrowRight: 39,
            ArrowDown: 40,
        };

        const keyDown = (element: Element, key: string) => {
            fireEvent.keyDown(element, {
                key,
                keyCode: keyCodes[key as keyof typeof keyCodes],
            });
        };

        const pressTab = async () => act(userEvent.setup({ delay: null }).tab);

        const getActiveElement = () => document.activeElement as Element;

        describe('when tab pressed', () => {
            it('should focus first focusable button', async () => {
                const { container } = render(<Calendar />);

                await pressTab();

                const activeElement = getActiveElement();

                expect(activeElement).toBeTruthy();
                expect(container.contains(activeElement)).toBeTruthy();
                expect(activeElement.tagName).toBe('BUTTON');
            });
        });

        describe('DaysTable', () => {
            it.each(Object.keys(keyCodes))(
                '%s should focus first non-disabled day of month if there is not focused day',
                async (key) => {
                    const { container } = render(
                        <Calendar
                            defaultMonth={defaultDate.getTime()}
                            offDays={[setDate(defaultDate, 1).getTime()]}
                        />,
                    );

                    await pressTab();

                    const dayTable = container.querySelector('table') as Element;

                    expect(dayTable.contains(getActiveElement())).toBeFalsy();

                    keyDown(getActiveElement(), key);

                    expect(dayTable.contains(getActiveElement())).toBeTruthy();

                    expect(getActiveElement().textContent).toBe('2');
                },
            );

            it.each(Object.keys(keyCodes))(
                '%s should focus selected day if there is not focused day',
                async (key) => {
                    render(<Calendar value={defaultDate.getTime()} />);

                    await pressTab();

                    keyDown(getActiveElement(), key);

                    expect(getActiveElement().textContent).toBe(defaultDateOfMonth);
                },
            );

            describe('ArrowLeft', () => {
                it('should move focus to prev day', async () => {
                    const prevDayOfMonth = (+defaultDateOfMonth - 1).toString();

                    render(<Calendar value={defaultValue} />);

                    await pressTab();

                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowLeft');
                        keyDown(getActiveElement(), 'ArrowLeft');
                    });

                    expect(getActiveElement().textContent).toBe(prevDayOfMonth);
                });

                it('should move focus to prev day in another month', async () => {
                    const firstDateOfMonth = setDate(defaultValue, 1);
                    const lastDateOfPrevMonth = subDays(firstDateOfMonth, 1);

                    const { getByText } = render(<Calendar value={firstDateOfMonth.getTime()} />);

                    await pressTab();

                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowLeft');
                        keyDown(getActiveElement(), 'ArrowLeft');
                    });

                    waitForTransition();

                    expect(firstDateOfMonth.getDate().toString()).toBe('1');

                    expect(lastDateOfPrevMonth.getDate().toString()).toBe('31');

                    expect(getActiveElement().tagName).toBe('TD');

                    expect(getByText('Октябрь')).toBeInTheDocument();

                    expect(getActiveElement().textContent).toBe(
                        lastDateOfPrevMonth.getDate().toString(),
                    );
                });

                it('should jump over disabled days', async () => {
                    const firstDateOfMonth = setDate(defaultValue, 1);
                    const lastDateOfPrevMonth = subDays(firstDateOfMonth, 1);
                    const selectedDate = addDays(firstDateOfMonth, 2);
                    const targetDate = subDays(lastDateOfPrevMonth, 1);

                    render(
                        <Calendar
                            value={selectedDate.getTime()}
                            offDays={[
                                lastDateOfPrevMonth,
                                firstDateOfMonth,
                                addDays(firstDateOfMonth, 1),
                            ]}
                        />,
                    );

                    await pressTab();

                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowLeft');
                        keyDown(getActiveElement(), 'ArrowLeft');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });
            });

            describe('ArrowRight', () => {
                it('should move focus to next day', async () => {
                    const nextDateOfMonth = addDays(defaultDate, 1);

                    render(<Calendar value={defaultValue} />);

                    await pressTab();

                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowRight');
                        keyDown(getActiveElement(), 'ArrowRight');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(
                        nextDateOfMonth.getDate().toString(),
                    );
                });

                it('should move focus to next day in another month', async () => {
                    const lastDateOfMonth = endOfMonth(defaultValue);
                    const firstDateOfNextMonth = addDays(lastDateOfMonth, 1);

                    const { getByText } = render(<Calendar value={lastDateOfMonth.getTime()} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowRight');
                        keyDown(getActiveElement(), 'ArrowRight');
                    });

                    waitForTransition();

                    expect(lastDateOfMonth.getDate().toString()).toBe('30');

                    expect(firstDateOfNextMonth.getDate().toString()).toBe('1');

                    expect(getActiveElement().tagName).toBe('TD');

                    expect(getByText('Декабрь')).toBeInTheDocument();

                    expect(getActiveElement().textContent).toBe(
                        firstDateOfNextMonth.getDate().toString(),
                    );
                });

                it('should jump over disabled days', async () => {
                    const lastDateOfMonth = endOfMonth(defaultValue);
                    const selectedDate = subDays(lastDateOfMonth, 1);
                    const firstDateOfNextMonth = addDays(lastDateOfMonth, 1);
                    const targetDate = addDays(firstDateOfNextMonth, 2);

                    render(
                        <Calendar
                            value={selectedDate.getTime()}
                            offDays={[
                                lastDateOfMonth,
                                firstDateOfNextMonth,
                                addDays(firstDateOfNextMonth, 1),
                            ]}
                        />,
                    );

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowRight');
                        keyDown(getActiveElement(), 'ArrowRight');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });
            });

            describe('ArrowUp', () => {
                it('should move focus to prev week', async () => {
                    const prevWeekDate = subDays(defaultValue, 7).getDate().toString();

                    render(<Calendar value={defaultValue} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowUp');
                        keyDown(getActiveElement(), 'ArrowUp');
                    });

                    expect(getActiveElement().textContent).toBe(prevWeekDate);
                });

                it('should move focus to prev week in another month', async () => {
                    const firstDateOfMonth = setDate(defaultValue, 1);
                    const targetDate = subDays(firstDateOfMonth, 7);

                    const { getByText } = render(<Calendar value={firstDateOfMonth.getTime()} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowUp');
                        keyDown(getActiveElement(), 'ArrowUp');
                    });

                    waitForTransition();

                    expect(firstDateOfMonth.getDate().toString()).toBe('1');

                    expect(targetDate.getDate().toString()).toBe('25');

                    expect(getActiveElement().tagName).toBe('TD');

                    expect(getByText('Октябрь')).toBeInTheDocument();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });

                it('should jump over disabled days', async () => {
                    const targetDate = subDays(defaultValue, 8);

                    render(<Calendar value={defaultValue} offDays={[subDays(defaultValue, 7)]} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowUp');
                        keyDown(getActiveElement(), 'ArrowUp');
                    });

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });
            });

            describe('ArrowDown', () => {
                it('should move focus to next week', async () => {
                    const nextWeekDate = addDays(defaultValue, 7).getDate().toString();

                    render(<Calendar value={defaultValue} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowDown');
                        keyDown(getActiveElement(), 'ArrowDown');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(nextWeekDate);
                });

                it('should move focus to next week in another month', async () => {
                    const lastDateOfMonth = endOfMonth(defaultValue);
                    const targetDate = addDays(lastDateOfMonth, 7);

                    const { getByText } = render(<Calendar value={lastDateOfMonth.getTime()} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowDown');
                        keyDown(getActiveElement(), 'ArrowDown');
                    });

                    waitForTransition();

                    expect(lastDateOfMonth.getDate().toString()).toBe('30');

                    expect(targetDate.getDate().toString()).toBe('7');

                    expect(getActiveElement().tagName).toBe('TD');

                    expect(getByText('Декабрь')).toBeInTheDocument();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });

                it('should jump over disabled days', async () => {
                    const targetDate = addDays(defaultValue, 8);

                    render(<Calendar value={defaultValue} offDays={[addDays(defaultValue, 7)]} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'ArrowDown');
                        keyDown(getActiveElement(), 'ArrowDown');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });
            });

            describe('End', () => {
                it('should move focus to end of week', async () => {
                    const targetDate = addDays(defaultValue, 6);

                    const { getByText } = render(<Calendar value={defaultValue} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'End');
                        keyDown(getActiveElement(), 'End');
                    });

                    waitForTransition();

                    expect(getActiveElement().tagName).toBe('TD');
                    expect(getByText('Декабрь')).toBeInTheDocument();
                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });

                it('should focus last non disabled day of week', async () => {
                    const targetDate = addDays(defaultValue, 5);

                    render(<Calendar value={defaultValue} offDays={[addDays(defaultValue, 6)]} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'End');
                        keyDown(getActiveElement(), 'End');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });
            });

            describe('Home', () => {
                it('should move focus to start of week', async () => {
                    const value = setDate(defaultValue, 1);
                    const targetDate = subDays(value, 6);

                    const { getByText } = render(<Calendar value={value.getTime()} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'Home');
                        keyDown(getActiveElement(), 'Home');
                    });

                    waitForTransition();

                    expect(getActiveElement().tagName).toBe('TD');
                    expect(getByText('Октябрь')).toBeInTheDocument();
                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });

                it('should focus first non disabled day of week', async () => {
                    const value = setDate(defaultValue, 1);
                    const targetDate = subDays(value, 6);

                    render(<Calendar value={value.getTime()} offDays={[subDays(value, 7)]} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'Home');
                        keyDown(getActiveElement(), 'Home');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });
            });

            describe('PageUp', () => {
                it('should move focus to prev month', async () => {
                    const targetDate = setMonth(defaultValue, defaultDate.getMonth() - 1);

                    const { getByText } = render(<Calendar value={defaultValue} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'PageUp');
                        keyDown(getActiveElement(), 'PageUp');
                    });

                    waitForTransition();

                    expect(getActiveElement().tagName).toBe('TD');
                    expect(getByText('Октябрь')).toBeInTheDocument();
                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });

                it('should jump over disabled days', async () => {
                    const prevMonthDate = setMonth(defaultValue, defaultDate.getMonth() - 1);
                    const targetDate = subDays(prevMonthDate, 1);

                    render(<Calendar value={defaultValue} offDays={[prevMonthDate]} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'PageUp');
                        keyDown(getActiveElement(), 'PageUp');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });
            });

            describe('PageDown', () => {
                it('should move focus to next month', async () => {
                    const targetDate = setMonth(defaultValue, defaultDate.getMonth() + 1);

                    const { getByText } = render(<Calendar value={defaultValue} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'PageDown');
                        keyDown(getActiveElement(), 'PageDown');
                    });

                    waitForTransition();

                    expect(getActiveElement().tagName).toBe('TD');
                    expect(getByText('Декабрь')).toBeInTheDocument();
                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });

                it('should jump over disabled days', async () => {
                    const prevMonthDate = setMonth(defaultValue, defaultDate.getMonth() + 1);
                    const targetDate = addDays(prevMonthDate, 1);

                    render(<Calendar value={defaultValue} offDays={[prevMonthDate]} />);

                    await pressTab();
                    await act(() => {
                        keyDown(getActiveElement(), 'PageDown');
                        keyDown(getActiveElement(), 'PageDown');
                    });

                    waitForTransition();

                    expect(getActiveElement().textContent).toBe(targetDate.getDate().toString());
                });
            });
        });

        describe('MonthsTable', () => {
            it.each(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])(
                '%s should focus selected or current month if there is not focused month',
                async (key) => {
                    const { getByText, container } = render(
                        <Calendar defaultMonth={defaultDate.getTime()} />,
                    );

                    fireEvent.click(getByText(defaultMonth));

                    await pressTab();

                    const monthsTable = container.querySelector('.monthsTable') as Element;

                    expect(monthsTable.contains(getActiveElement())).toBeFalsy();

                    keyDown(getActiveElement(), key);

                    expect(monthsTable.contains(getActiveElement())).toBeTruthy();

                    expect(getActiveElement().textContent).toBe('Ноябрь');
                },
            );

            describe('ArrowLeft', () => {
                it('should focus prev month', async () => {
                    const { getByText } = render(<Calendar defaultMonth={defaultDate.getTime()} />);

                    fireEvent.click(getByText(defaultMonth));

                    await pressTab();

                    keyDown(getActiveElement(), 'ArrowLeft');

                    ['Октябрь', 'Сентябрь'].forEach((month) => {
                        keyDown(getActiveElement(), 'ArrowLeft');
                        expect(getActiveElement().textContent).toBe(month);
                    });
                });
            });

            describe('ArrowRight', () => {
                it('should focus next month', async () => {
                    const { getByText } = render(<Calendar defaultMonth={defaultDate.getTime()} />);

                    fireEvent.click(getByText(defaultMonth));

                    await pressTab();

                    keyDown(getActiveElement(), 'ArrowRight');

                    ['Декабрь', 'Декабрь'].forEach((month) => {
                        keyDown(getActiveElement(), 'ArrowRight');
                        expect(getActiveElement().textContent).toBe(month);
                    });
                });
            });

            describe('ArrowUp', () => {
                it('should focus n - 3 month', async () => {
                    const { getByText } = render(<Calendar defaultMonth={defaultDate.getTime()} />);

                    fireEvent.click(getByText(defaultMonth));

                    await pressTab();

                    keyDown(getActiveElement(), 'ArrowUp');

                    ['Август', 'Май', 'Февраль', 'Февраль'].forEach((month) => {
                        keyDown(getActiveElement(), 'ArrowUp');
                        expect(getActiveElement().textContent).toBe(month);
                    });
                });
            });

            describe('ArrowDown', () => {
                it('should focus n + 3 month', async () => {
                    const { getByText } = render(
                        <Calendar defaultMonth={setMonth(defaultDate, 0).getTime()} />,
                    );

                    fireEvent.click(getByText('Январь'));

                    await pressTab();

                    keyDown(getActiveElement(), 'ArrowDown');

                    ['Апрель', 'Июль', 'Октябрь', 'Октябрь'].forEach((month) => {
                        keyDown(getActiveElement(), 'ArrowDown');
                        expect(getActiveElement().textContent).toBe(month);
                    });
                });
            });
        });

        describe('YearsTable', () => {
            it.each(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])(
                '%s should focus selected or current year if there is not focused year',
                async (key) => {
                    const { getByText, container } = render(
                        <Calendar defaultMonth={defaultDate.getTime()} />,
                    );

                    fireEvent.click(getByText(defaultYear));

                    await pressTab();

                    const yearsTable = container.querySelector('.yearsTable') as Element;

                    expect(yearsTable.contains(getActiveElement())).toBeFalsy();

                    keyDown(getActiveElement(), key);

                    expect(yearsTable.contains(getActiveElement())).toBeTruthy();

                    expect(getActiveElement().textContent).toBe('2020');
                },
            );

            describe('ArrowRight', () => {
                it('should focus prev year', async () => {
                    const { getByText } = render(<Calendar defaultMonth={defaultDate.getTime()} />);

                    fireEvent.click(getByText(defaultYear));

                    await pressTab();

                    keyDown(getActiveElement(), 'ArrowRight');

                    ['2019', '2018', '2017'].forEach((year) => {
                        keyDown(getActiveElement(), 'ArrowRight');
                        expect(getActiveElement().textContent).toBe(year);
                    });
                });
            });

            describe('ArrowLeft', () => {
                it('should focus next year', async () => {
                    const { getByText } = render(<Calendar defaultMonth={defaultDate.getTime()} />);

                    fireEvent.click(getByText(defaultYear));

                    await pressTab();

                    keyDown(getActiveElement(), 'ArrowRight');
                    keyDown(getActiveElement(), 'ArrowRight');
                    keyDown(getActiveElement(), 'ArrowRight');

                    ['2019', '2020'].forEach((year) => {
                        keyDown(getActiveElement(), 'ArrowLeft');
                        expect(getActiveElement().textContent).toBe(year);
                    });
                });
            });

            describe('ArrowUp', () => {
                it('should focus n + 3 year', async () => {
                    const { getByText } = render(<Calendar defaultMonth={defaultDate.getTime()} />);

                    fireEvent.click(getByText(defaultYear));

                    await pressTab();

                    keyDown(getActiveElement(), 'ArrowUp');
                    keyDown(getActiveElement(), 'ArrowDown');
                    keyDown(getActiveElement(), 'ArrowDown');

                    ['2017', '2020'].forEach((year) => {
                        keyDown(getActiveElement(), 'ArrowUp');
                        expect(getActiveElement().textContent).toBe(year);
                    });
                });
            });

            describe('ArrowDown', () => {
                it('should focus n - 3 month', async () => {
                    const { getByText } = render(<Calendar defaultMonth={defaultDate.getTime()} />);

                    fireEvent.click(getByText(defaultYear));

                    await pressTab();

                    keyDown(getActiveElement(), 'ArrowDown');

                    ['2017', '2014'].forEach((year) => {
                        keyDown(getActiveElement(), 'ArrowDown');
                        expect(getActiveElement().textContent).toBe(year);
                    });
                });
            });
        });
    });

    describe('Render tests', () => {
        test('should unmount without errors', () => {
            const { unmount } = render(<Calendar />);

            expect(unmount).not.toThrowError();
        });
    });
});
