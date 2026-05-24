import { Command } from 'commander';
import { runScreenshots } from './runner/run';
import { renderFinalImages } from './templates/render';
import { listDevices } from './runner/android';
import chalk from 'chalk';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('screenshot-runner')
  .description('Automated screenshot factory for Capacitor apps')
  .version('1.0.0');

program
  .command('run')
  .description('Run screenshots for a specific app configuration')
  .argument('<app-config>', 'Path to the app JSON configuration')
  .option('-d, --device <id>', 'Specific device ID to use')
  .option('-t, --type <type>', 'Device type (phone or tablet)')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-f, --force', 'Force run even if installation fails')
  .action(async (configPath, options) => {
    try {
      const devices = await listDevices();

      if (devices.length === 0) {
        throw new Error('No emulator or device connected via ADB');
      }

      let serial = options.device;
      if (!serial && devices.length > 1) {
        const result = await inquirer.prompt([
          {
            type: 'list',
            name: 'serial',
            message: 'Multiple devices found. Select one:',
            choices: devices,
          },
        ]);
        serial = result.serial;
      } else if (!serial) {
        serial = devices[0];
      }

      let deviceType = options.type;
      if (!deviceType || !['phone', 'tablet'].includes(deviceType)) {
        const result = await inquirer.prompt([
          {
            type: 'list',
            name: 'deviceType',
            message: 'Select device type for these screenshots:',
            choices: ['phone', 'tablet'],
            default: 'phone',
          },
        ]);
        deviceType = result.deviceType;
      }

      console.log(chalk.blue.bold(`\n🚀 Starting Screenshot Factory for ${configPath}`));
      await runScreenshots({
        configPath,
        serial,
        deviceType,
        force: options.force,
        verbose: options.verbose,
      });
      console.log(chalk.green.bold('\n✅ Raw screenshots captured successfully!'));
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error during screenshot run:'), error);
      process.exit(1);
    }
  });

program
  .command('render')
  .description('Render raw screenshots into market-ready images')
  .argument('<app-config>', 'Path to the app JSON configuration')
  .option('-t, --type <type>', 'Device type (phone or tablet)')
  .action(async (configPath, options) => {
    try {
      let deviceType = options.type;
      if (!deviceType || !['phone', 'tablet'].includes(deviceType)) {
        const result = await inquirer.prompt([
          {
            type: 'list',
            name: 'deviceType',
            message: 'Select device type to render:',
            choices: ['phone', 'tablet'],
            default: 'phone',
          },
        ]);
        deviceType = result.deviceType;
      }

      console.log(chalk.blue.bold(`\n🎨 Rendering final images for ${configPath}`));
      await renderFinalImages({
        configPath,
        deviceType,
      });
      console.log(chalk.green.bold('\n✅ Final images rendered successfully!'));
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error during rendering:'), error);
      process.exit(1);
    }
  });

program.parse();
