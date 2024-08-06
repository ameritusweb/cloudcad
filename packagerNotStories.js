const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const yargs = require('yargs');
const { minify } = require('html-minifier');

// Define command line arguments
const argv = yargs
  .option('appDir', {
    alias: 'a',
    description: 'The directory of the React application',
    type: 'string',
    demandOption: true,
  })
  .option('outputFile', {
    alias: 'o',
    description: 'The output file path',
    type: 'string',
    default: 'combinedApp.txt',
  })
  .help()
  .alias('help', 'h')
  .argv;

// Define the directory containing your React application
const appDirectory = path.resolve(argv.appDir);

// Define the output file path
const outputFilePath = path.resolve(argv.outputFile);

// Read the .gitignore file
const gitignorePath = path.join(appDirectory, '.gitignore');
const ig = ignore();

// Custom ignore list
const customIgnoreList = ['mockServiceWorker.js'];

// Load the .gitignore file
async function loadGitignore() {
  try {
    const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf8');
    ig.add(gitignoreContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('.gitignore file not found, proceeding without ignoring any files.');
    } else {
      console.error('Error reading .gitignore file:', error.message);
      throw error;
    }
  }

  // Add custom ignore list
  ig.add(customIgnoreList);
}

// Helper function to read file content
async function readFileContent(filePath) {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    throw error;
  }
}

// Function to recursively get all files in a directory, filtering by .gitignore
async function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
    const files = await fs.promises.readdir(dirPath);

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const relativePath = path.relative(appDirectory, fullPath);

      if (ig.ignores(relativePath) || relativePath.includes('node_modules') || relativePath.includes('stories') || relativePath.includes('utils')) {
        continue;
      }

      const stat = await fs.promises.stat(fullPath);
      if (stat.isDirectory()) {
        await getAllFiles(fullPath, arrayOfFiles);
      } else if (/\.(js|jsx|ts|tsx|css|html|py)$/i.test(file)) { // Case-insensitive matching
        arrayOfFiles.push(fullPath);
      }
    }

    return arrayOfFiles;
  } catch (error) {
    console.error(`Error accessing directory ${dirPath}:`, error.message);
    throw error;
  }
}

// Minify HTML content
function minifyHtml(content) {
  return minify(content, {
    collapseWhitespace: true,
    removeComments: true,
    minifyJS: true,
    minifyCSS: true,
  });
}

// Main function to create the combined file
async function createCombinedFile() {
  try {
    await loadGitignore();

    const allFiles = await getAllFiles(appDirectory);

    // Create a write stream
    const writeStream = fs.createWriteStream(outputFilePath);

    for (const [index, absoluteFilePath] of allFiles.entries()) {
      let fileContent = await readFileContent(absoluteFilePath);

      // Minify HTML files
      if (absoluteFilePath.endsWith('.html')) {
        fileContent = minifyHtml(fileContent);
      }

      const separator = index > 0 ? '\n/* ' + '='.repeat(80) + ' */\n' : ''; // Add comment separator except before the first file
      writeStream.write(separator + fileContent);
    }

    writeStream.end();
    console.log(`Combined file created at ${outputFilePath}`);
  } catch (error) {
    console.error('Error creating combined file:', error.message);
  }
}

// Run the main function
createCombinedFile();
