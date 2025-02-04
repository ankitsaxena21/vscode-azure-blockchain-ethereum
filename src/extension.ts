// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { commands, ExtensionContext, Uri, window } from 'vscode';
import {
  ContractCommands,
  DebuggerCommands,
  GanacheCommands,
  LogicAppCommands,
  OpenZeppelinCommands,
  ProjectCommands,
  ServiceCommands,
  TruffleCommands,
} from './commands';
import { Constants } from './Constants';
import { CommandContext, isWorkspaceOpen, required, setCommandContext } from './helpers';
import { CancellationEvent } from './Models';
import { Output } from './Output';
import { RequirementsPage, WelcomePage } from './pages';
import { AdapterType, ContractDB, GanacheService, MnemonicRepository, TreeManager, TreeService } from './services';
import { Telemetry } from './TelemetryClient';
import { ProjectView } from './ViewItems';

import { DebuggerConfiguration } from './debugAdapter/configuration/debuggerConfiguration';

export async function activate(context: ExtensionContext) {
  Constants.initialize(context);
  DebuggerConfiguration.initialize(context);
  await ContractDB.initialize(AdapterType.IN_MEMORY);
  MnemonicRepository.initialize(context.globalState);
  TreeManager.initialize(context.globalState);
  TreeService.initialize('AzureBlockchain');

  setCommandContext(CommandContext.Enabled, true);
  setCommandContext(CommandContext.IsWorkspaceOpen, isWorkspaceOpen());

  const welcomePage = new WelcomePage(context);
  const requirementsPage = new RequirementsPage(context);

  await welcomePage.checkAndShow();

  //#region azureBlockchain extension commands
  const refresh = commands.registerCommand('azureBlockchainService.refresh', (element) => {
    TreeService.refresh(element);
  });
  const showWelcomePage = commands.registerCommand('azureBlockchainService.showWelcomePage', async () => {
    return welcomePage.show();
  });
  const showRequirementsPage = commands.registerCommand('azureBlockchainService.showRequirementsPage',
    async (checkShowOnStartup: boolean) => {
      return checkShowOnStartup ? await requirementsPage.checkAndShow() : await requirementsPage.show();
    });
  //#endregion

  //#region Ganache extension commands
  const startGanacheServer = commands.registerCommand('azureBlockchainService.startGanacheServer',
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GanacheCommands.startGanacheCmd(viewItem));
    });

  const stopGanacheServer = commands.registerCommand('azureBlockchainService.stopGanacheServer',
    async (viewItem?: ProjectView) => {
      await tryExecute(() => GanacheCommands.stopGanacheCmd(viewItem));
    });
  //#endregion

  //#region truffle commands
  const newSolidityProject = commands.registerCommand('truffle.newSolidityProject', async () => {
    await tryExecute(() => ProjectCommands.newSolidityProject());
  });
  const buildContracts = commands.registerCommand('truffle.buildContracts', async () => {
    await tryExecute(() => TruffleCommands.buildContracts());
  });
  const deployContracts = commands.registerCommand('truffle.deployContracts', async () => {
    await tryExecute(() => TruffleCommands.deployContracts());
  });
  const copyByteCode = commands.registerCommand('contract.copyByteCode', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeBytecodeToBuffer(uri));
  });
  const copyABI = commands.registerCommand('contract.copyABI', async (uri: Uri) => {
    await tryExecute(() => TruffleCommands.writeAbiToBuffer(uri));
  });
  const copyRPCEndpointAddress = commands.registerCommand('azureBlockchainService.copyRPCEndpointAddress',
    async (viewItem: ProjectView) => {
      await tryExecute(() => TruffleCommands.writeRPCEndpointAddressToBuffer(viewItem));
    });
  const getPrivateKeyFromMnemonic = commands.registerCommand('azureBlockchainService.getPrivateKey', async () => {
    await tryExecute(() => TruffleCommands.getPrivateKeyFromMnemonic());
  });
  //#endregion

  //#region services with dialog
  const createProject = commands.registerCommand('azureBlockchainService.createProject', async () => {
    await tryExecute(() => ServiceCommands.createProject());
  });
  const connectProject = commands.registerCommand('azureBlockchainService.connectProject', async () => {
    await tryExecute(() => ServiceCommands.connectProject());
  });
  const disconnectProject = commands.registerCommand('azureBlockchainService.disconnectProject',
    async (viewItem: ProjectView) => {
      await tryExecute(() => ServiceCommands.disconnectProject(viewItem));
    });
  //#endregion

  //#region contract commands
  const showSmartContractPage = commands.registerCommand(
    'azureBlockchainService.showSmartContractPage',
    async (contractPath: Uri) => {
      await tryExecute(() => ContractCommands.showSmartContractPage(context, contractPath));
    });
  //#endregion

  //#region open zeppelin commands
  const openZeppelinAddCategory = commands.registerCommand('openZeppelin.addCategory', async () => {
    await tryExecute(() => OpenZeppelinCommands.addCategory());
  });
  //#endregion

  //#region logic app commands
  const generateMicroservicesWorkflows = commands.registerCommand(
    'azureBlockchainService.generateMicroservicesWorkflows',
    async (filePath: Uri | undefined) => {
      await tryExecute(() => LogicAppCommands.generateMicroservicesWorkflows(filePath));
    });
  const generateDataPublishingWorkflows = commands.registerCommand(
    'azureBlockchainService.generateDataPublishingWorkflows',
    async (filePath: Uri | undefined) => {
      await tryExecute(() => LogicAppCommands.generateDataPublishingWorkflows(filePath));
    });
  const generateEventPublishingWorkflows = commands.registerCommand(
    'azureBlockchainService.generateEventPublishingWorkflows',
    async (filePath: Uri | undefined) => {
      await tryExecute(() => LogicAppCommands.generateEventPublishingWorkflows(filePath));
    });
  const generateReportPublishingWorkflows = commands.registerCommand(
    'azureBlockchainService.generateReportPublishingWorkflows',
    async (filePath: Uri | undefined) => {
      await tryExecute(() => LogicAppCommands.generateReportPublishingWorkflows(filePath));
    });
  //#endregion

  //#region debugger commands
  const startDebugger = commands.registerCommand('extension.truffle.debugTransaction', async () => {
    await tryExecute(() => DebuggerCommands.startSolidityDebugger());
  });
  //#endregion

  const subscriptions = [
    showWelcomePage,
    showRequirementsPage,
    showSmartContractPage,
    refresh,
    newSolidityProject,
    buildContracts,
    deployContracts,
    createProject,
    connectProject,
    disconnectProject,
    copyByteCode,
    copyABI,
    copyRPCEndpointAddress,
    startGanacheServer,
    stopGanacheServer,
    generateMicroservicesWorkflows,
    generateDataPublishingWorkflows,
    generateEventPublishingWorkflows,
    generateReportPublishingWorkflows,
    getPrivateKeyFromMnemonic,
    startDebugger,
    openZeppelinAddCategory,
  ];
  context.subscriptions.push(...subscriptions);

  required.checkAllApps();

  Telemetry.sendEvent(Constants.telemetryEvents.extensionActivated);
}

export async function deactivate(): Promise<void> {
  // This method is called when your extension is deactivated
  // To dispose of all extensions, vscode provides 5 sec.
  // Therefore, please, call important dispose functions first and don't use await
  // For more information see https://github.com/Microsoft/vscode/issues/47881
  GanacheService.dispose();
  ContractDB.dispose();
  Telemetry.dispose();
  TreeManager.dispose();
  Output.dispose();
}

async function tryExecute(func: () => Promise<any>, errorMessage: string | null = null): Promise<void> {
  try {
    await func();
  } catch (error) {
    if (error instanceof CancellationEvent) {
      return;
    }
    window.showErrorMessage(errorMessage || error.message);
  }
}
