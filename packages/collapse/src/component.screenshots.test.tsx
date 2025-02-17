import {
    createStorybookUrl,
    openBrowserPage,
    matchHtml,
    closeBrowser,
} from '../../screenshot-utils';

const clip = { x: 0, y: 0, width: 1920, height: 200 };

describe('Collapse | interactions tests', () => {
    test('Collapse component', async () => {
        const pageUrl = createStorybookUrl({
            componentName: 'Collapse',
            knobs: {},
            testStory: false,
        });

        const { browser, context, page, css } = await openBrowserPage(pageUrl);

        try {
            await matchHtml({
                context,
                page,
                expect,
                css,
                screenshotOpts: { clip },
                matchImageSnapshotOptions: {
                    failureThresholdType: 'percent',
                    failureThreshold: 0.2,
                },
            });

            await page.click('button[class*=component]');

            await matchHtml({
                context,
                page,
                expect,
                css,
                screenshotOpts: { clip },
                matchImageSnapshotOptions: {
                    failureThresholdType: 'percent',
                    failureThreshold: 0.2,
                },
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error((error as Error).message);

            throw error;
        } finally {
            await closeBrowser({ browser, context, page });
        }
    });
});
