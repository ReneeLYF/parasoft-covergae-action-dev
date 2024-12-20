import * as core from "@actions/core";

import { messages } from './messages';
import * as runner from "./runner";

export async function run() {
    try {
        // TODO: Add run options (eg., covReportDir) and pass them to run()
        const theRunner = new runner.CoverageParserRunner();
        const outcome = await theRunner.run();

        if (outcome.exitCode != 0) {
            // TODO: When implement cobertura transforming
        } else {
            core.info(messages.exit_code + outcome.exitCode);
        }
    } catch (error) {
        core.error(messages.run_failed);
        if (error instanceof Error) {
            core.error(error);
            core.setFailed(error.message);
        }
    }
}

if (require.main === module) {
    run();
}