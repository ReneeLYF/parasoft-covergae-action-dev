import * as core from "@actions/core";
import * as types from './types';

export class CoverageParserRunner {
    async run() : Promise<types.RunDetails> {
        // TODO: Get the actual coverage node data
        const coverageNode = await this.getCoverageNode(); // Simulate coverageNode input for testing

        return await this.generateCoverageSummary(coverageNode);
    }

    private async generateCoverageSummary(coverageNode: types.CoberturaCoverageNode): Promise<types.RunDetails> {
        if (!coverageNode) {
            return Promise.reject("Coverage node not found");
        }

        const markdown = this.generateMarkdownContent(coverageNode.packages);
        const totalCoverage = this.formatCoverage(coverageNode.linesCovered, coverageNode.linesValid, coverageNode.lineRate);

        await core.summary
            .addHeading('Parasoft Coverage')
            .addRaw("<table><tbody><tr><th>Coverage&emsp;(covered/total - percentage)</th></tr>"
                + "<tr><td><b>Total coverage&emsp;(" + totalCoverage + ")</b></td></tr>"
                + markdown + "</tbody></table>")
            .write();

        return {exitCode: 1};
    }

    private async generateMarkdownContent(packagesNode: Map<string, types.CoberturaPackageNode>) {
        if (!packagesNode || (packagesNode.size === 0)) {
            return Promise.reject("Package not found");
        }

        const markdownRows = await Promise.all(
            Array.from(packagesNode.entries()).map(async ([packageName, packageNode]) => {
                const {coveredLines, totalLines, markdownContent} = await this.calculatePackageCoverage(packageNode);
                const packageCoverage = this.formatCoverage(coveredLines, totalLines, packageNode.lineRate);

                return `
                    <tr>
                        <td>
                            <details>
                                <summary>${packageName} (${packageCoverage})</summary>
                                <table>
                                    <tbody>${markdownContent}</tbody>
                                </table>
                            </details>
                        </td>
                    </tr>
                `;
            })
        );

        return markdownRows.join('');
        // return Array.from(packagesNode.entries()).map(async ([packageName, packageNode]) => {
        //     const {coveredLines, totalLines, markdownContent} = await this.calculatePackageCoverage(packageNode);
        //     const packageCoverage = this.formatCoverage(coveredLines, totalLines, packageNode.lineRate);
        //
        //     return "<tr><td><details>" +
        //         "<summary>" + packageName + "&emsp;(" + packageCoverage + ")</summary>" +
        //         "<table><tbody>" + markdownContent + "</tbody></table>" +
        //         "</details></td></tr>";
        // }).join('');
    }

    private async calculatePackageCoverage(packageNode: types.CoberturaPackageNode): Promise<{ coveredLines: number, totalLines: number, markdownContent: string }> {
        if (!packageNode) {
            return Promise.reject("Package not found");
        }

        let coveredLines = 0;
        let totalLines = 0;
        let markdownContent = '';

        packageNode.classes.forEach(classNode => {
            coveredLines += classNode.coveredLines;
            totalLines += classNode.lines.length;
            const classCoverage = this.formatCoverage(classNode.coveredLines, classNode.lines.length, classNode.lineRate);

            markdownContent += `
                <tr>
                    <td>&emsp;${classNode.name} (${classCoverage})</td>
                </tr>
            `;
            // markdownContent += "<tr><td>&emsp;" + classNode.name + "&emsp;(" + classCoverage + ")</td></tr>";
        });

        return { coveredLines, totalLines, markdownContent };
    }

    private formatCoverage(covered: number, total: number, rate: number) {
        if (covered < 0 || total < 0) {
            return Promise.reject("The covered lines and total lines must be non-negative.")
        }
        if (rate < 0 || rate > 1) {
            return Promise.reject('The line rate must be between 0 and 1.');
        }

        return `${covered}/${total} - ${(rate * 100).toFixed(2)}%`;
    }

    private async getCoverageNode(): Promise<types.CoberturaCoverageNode> {
        return {
            lineRate: 0.85,
            linesCovered: 170,
            linesValid: 200,
            packages: new Map<string, types.CoberturaPackageNode>([
                [
                    'com.example.package1', // Package name
                    {
                        name: 'com.example.package1',
                        lineRate: 0.9,
                        classes: new Map<string, types.CoberturaClassNode>([
                            [
                                'MyClass1.java', // Class file name
                                {
                                    classId: 'MyClass1.java|MyClass1', // Combination of filename + class name
                                    fileName: 'MyClass1.java',
                                    name: 'MyClass1',
                                    lineRate: 0.95,
                                    coveredLines: 19,
                                    lines: [
                                        { lineNumber: 1, lineHash: 'abc123', hits: 1 },
                                        { lineNumber: 2, lineHash: 'def456', hits: 0 },
                                        { lineNumber: 3, lineHash: 'ghi789', hits: 1 },
                                    ]
                                }
                            ],
                            [
                                'MyClass2.java',
                                {
                                    classId: 'MyClass2.java|MyClass2',
                                    fileName: 'MyClass2.java',
                                    name: 'MyClass2',
                                    lineRate: 0.80,
                                    coveredLines: 16,
                                    lines: [
                                        { lineNumber: 1, lineHash: 'jkl012', hits: 1 },
                                        { lineNumber: 2, lineHash: 'mno345', hits: 0 },
                                        { lineNumber: 3, lineHash: 'pqr678', hits: 1 }
                                    ]
                                }
                            ]
                        ])
                    }
                ],
                [
                    'com.example.package2',
                    {
                        name: 'com.example.package2',
                        lineRate: 0.75,
                        classes: new Map<string, types.CoberturaClassNode>([
                            [
                                'MyClass3.java',
                                {
                                    classId: 'MyClass3.java|MyClass3',
                                    fileName: 'MyClass3.java',
                                    name: 'MyClass3',
                                    lineRate: 0.70,
                                    coveredLines: 14,
                                    lines: [
                                        { lineNumber: 1, lineHash: 'stu901', hits: 1 },
                                        { lineNumber: 2, lineHash: 'vwx234', hits: 0 },
                                        { lineNumber: 3, lineHash: 'yzab567', hits: 1 }
                                    ]
                                }
                            ]
                        ])
                    }
                ]
            ])
        };
    }
}
