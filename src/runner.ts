import * as core from "@actions/core";
import * as types from './types';

import { messages } from './messages';

export class CoverageParserRunner {
    async run() : Promise<types.RunDetails> {
        // TODO: Simulate coverageNode input for testing the structure implemented in current task
        const coverageNode = this.getCoverageNode();

        await this.generateCoverageSummary(coverageNode);
        return { exitCode: 0 };
    }

    private async generateCoverageSummary(coverageNode: types.CoberturaCoverageNode) {
        if (!coverageNode) {
            throw new Error(messages.missing_coverage_data);
        }

        const markdown = this.generateMarkdownContent(coverageNode.packages);
        const totalCoverage = this.formatCoverage(coverageNode.linesCovered, coverageNode.linesValid, coverageNode.lineRate);

        await core.summary
            .addHeading('Parasoft Coverage')
            .addRaw("<table><tbody><tr><th>Coverage&emsp;(covered/total - percentage)</th></tr>"
                + "<tr><td><b>Total coverage&emsp;(" + totalCoverage + ")</b></td></tr>"
                + markdown + "</tbody></table>")
            .write();
    }

    private generateMarkdownContent(packagesNode: Map<string, types.CoberturaPackageNode>) {
        if (!packagesNode || packagesNode.size === 0) {
            throw new Error(messages.missing_coverage_data);
        }

        const markdownRows: string[] = [];
        for (const [packageName, packageNode] of packagesNode.entries()) {
            const { coveredLines, totalLines, markdownContent } = this.calculatePackageCoverage(packageNode);
            const packageCoverage = this.formatCoverage(coveredLines, totalLines, packageNode.lineRate);

            markdownRows.push("<tr><td><details>" +
                "<summary>" + packageName + "&emsp;(" + packageCoverage + ")</summary>" +
                "<table><tbody>" + markdownContent + "</tbody></table>" +
                "</details></td></tr>");
        }

        return markdownRows.join('');
    }

    private calculatePackageCoverage(packageNode: types.CoberturaPackageNode): { coveredLines: number, totalLines: number, markdownContent: string } {
        if (!packageNode) {
            throw new Error(messages.invalid_package_data);
        }

        let coveredLines = 0;
        let totalLines = 0;
        const markdownRows: string[] = [];

        for (const classNode of packageNode.classes.values()) {
            coveredLines += classNode.coveredLines;
            totalLines += classNode.lines.length;
            const classCoverage = this.formatCoverage(classNode.coveredLines, classNode.lines.length, classNode.lineRate);

            markdownRows.push(`<tr><td>&emsp;${classNode.name}&emsp;(${classCoverage})</td></tr>`);
        }

        return { coveredLines, totalLines, markdownContent: markdownRows.join('') };
    }

    private formatCoverage(covered: number, total: number, rate: number): string {
        if (covered < 0 || total < 0) {
            throw new Error(messages.negative_coverage_values);
        }
        if (rate < 0 || rate > 1) {
            throw new Error(messages.invalid_coverage_rate);
        }

        return `${covered}/${total} - ${(rate * 100).toFixed(2)}%`;
    }

    private getCoverageNode(): types.CoberturaCoverageNode {
        // Simulate coverage data
        return {
            lineRate: 0.85,
            linesCovered: 170,
            linesValid: 200,
            packages: new Map()
        };
    }
}
