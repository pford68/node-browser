const fs = require('fs');
const CDP = require('chrome-remote-interface');
const launcher = require('chrome-launcher');
const argv =require('minimist')(process.argv);

if (!argv.url){
    throw new Error('A URL is required.');
}


(async function() {
    async function launchChrome() {
        return await launcher.launch({
            chromeFlags: [
                '--disable-gpu',
                '--headless'
            ]
        });
    }
    const chrome = await launchChrome();
    const protocol = await CDP({
        port: chrome.port
    });

    const {
        DOM,
        Page,
        Emulation,
        Runtime
    } = protocol;
    await Promise.all([
        Page.enable(),
        Runtime.enable(),
        DOM.enable()
    ]).then(() => {
        Page.navigate({
            url: argv.url
        });
    });

    Page.loadEventFired(async() => {
        const script1 = "document.querySelector('p').textContent";
        // Evaluate script1
        const result = await Runtime.evaluate({
            expression: script1
        });
        console.log(result.result.value);

        if (argv.out) {
            const ss = await Page.captureScreenshot({format: 'png', fromSurface: true});
            fs.writeFile(argv.out, ss.data, 'base64', function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }

        protocol.close();
        chrome.kill();
    });

})();

/*
CDP((client) => {
    // Extract used DevTools domains.
    const {Page, Runtime} = client;

    // Enable events on domains we are interested in.
    Promise.all([
        Page.enable()
    ]).then(() => {
        return Page.navigate({url: argv[2]});
    });

    // Evaluate outerHTML after page has loaded.
    Page.loadEventFired(() => {
        Runtime.evaluate({expression: 'document.body.outerHTML'}).then((result) => {
            console.log(result.result.value);
            client.close();
        });
    });
}).on('error', (err) => {
    console.error('Cannot connect to browser:', err);
});
*/