import path from 'path';
import fs from 'fs';
import util from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writeFile = util.promisify(fs.writeFile);

const writeCircleCiConfig = async (config) => {

    let yaml = `version: 2.1
orbs:
    node: circleci/node@4.1.0
parameters:
    GHA_Action:
        type: string
        default: ''
    GHA_CommitSha:
        type: string
        default: ''
    GHA_Workflow_Name:
        type: string
        default: ''
    GHA_DeployTag:
        type: string
        default: ''

executors:
    ubuntu:
        machine:
            image: ubuntu-2004:202111-01
            docker_layer_caching: false
    ubuntu-caching:
        machine:
            image: ubuntu-2004:202111-01
            docker_layer_caching: true

workflows:
    version: 2
    pull_request:
        when: ["", << pipeline.parameters.GHA_Action >> ]
        jobs:
            - build:
                context: org-global
                filters:
                    branches:
                        only:
                            - main
            - test:
                context: org-global
                requires:
                    - build
                filters:
                    branches:
                        only:
                            - main
    ${process.env.GHA_wWorkflow_Name || 'deploy_app'}:
        when: ["deploy_app", << pipeline.parameters.GHA_Action >> ]
        jobs:
            - deploy:
                context: org-global
                requires:
                    - test
                filters:
                    branches:
                        only:
                            - main
    cut_release:
        when: ["cut_release", << pipeline.parameters.GHA_Action >> ]
        jobs:
            - cut_release:
                executor: ubuntu
                resource_class: small
                steps:
                    - checkout
                    - node/install
                    - run:
                        name: Cut Release
                        command: bash .circleci/scripts/cut_release.sh -a "<< pipeline.parameters.GHA_CommitSha >>"
    `;
    await writeFile(path.join(__dirname, '../.circleci/new_config.yml'), yaml);
}

(() => writeCircleCiConfig().catch(console.error))();
