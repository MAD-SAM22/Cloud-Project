import express from 'express';
import bodyParser from 'body-parser';
import { exec, execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const router = express.Router();

router.use(bodyParser.json());

// Define directories
// Get current file path (using ES module approach)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define directories (in the same directory as this file)
const DISK_DIR = path.resolve(__dirname, 'disks');
const ISO_DIR = path.resolve(__dirname, 'iso');
const VM_DIR = path.resolve(__dirname, 'vms');

// Create directories if they don't exist
if (!fs.existsSync(VM_DIR)) fs.mkdirSync(VM_DIR, { recursive: true });
if (!fs.existsSync(ISO_DIR)) fs.mkdirSync(ISO_DIR, { recursive: true });
if (!fs.existsSync(DISK_DIR)) fs.mkdirSync(DISK_DIR, { recursive: true });

// Constants
const RESIZE_SUPPORTED_FORMATS = ['qcow2', 'raw', 'vmdk'];
const SUPPORTED_FORMATS = ['qcow2', 'vmdk', 'raw', 'vdi', 'vpc'];
const DYNAMIC_ONLY_FORMATS = ['vdi', 'vpc'];
const FIXED_UNSUPPORTED_ON_WINDOWS = ['qcow2'];

// Create Disk
router.post('/create-disk', (req, res) => {
    let { name, size, format, type = 'dynamic' } = req.body;

    format = format.toLowerCase();
    type = type.toLowerCase();

    if (!name || !size || !format || !SUPPORTED_FORMATS.includes(format)) {
        return res.status(400).json({ error: `Invalid or missing disk parameters. Supported formats: ${SUPPORTED_FORMATS.join(', ')}` });
    }

    const filePath = path.join(DISK_DIR, `${name}.${format}`);
    const isWindows = os.platform() === 'win32';
    let options = '';

    switch (format) {
        case 'qcow2':
            if (type === 'fixed') {
                if (isWindows) {
                    console.warn(`⚠️ Skipping preallocation=full on Windows`);
                    options = '-o preallocation=metadata'; // fallback
                } else {
                    options = '-o preallocation=full';
                }
            } else {
                options = '-o preallocation=metadata';
            }
            break;

        case 'vmdk':
            options = type === 'fixed' ? '-o subformat=monolithicFlat' : '-o subformat=streamOptimized';
            break;

        case 'raw':
            if (type === 'dynamic') {
                return res.status(400).json({
                    error: `'raw' format does not support dynamic disks. Use 'fixed' or omit the type.`
                });
            }
            break;

        case 'vdi':
        case 'vpc':
            if (type === 'fixed') {
                return res.status(400).json({
                    error: `'${format}' format does not support fixed disks. Only dynamic allocation is supported.`
                });
            }
            break;
    }

    const command = `qemu-img create -f ${format} ${options} "${filePath}" ${size}G`;

    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error creating disk: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }
        console.log(`✅ Disk created: ${stdout}`);
        res.json({ message: `✅ Disk "${name}.${format}" created successfully` });
    });
});

// CREATE VM
router.post('/create-vm', (req, res) => {
    const { name, cpu, memory, diskName, format, iso } = req.body;

    if (!name || !cpu || !memory || !diskName || !format) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const diskPath = path.join(DISK_DIR, `${diskName}.${format}`);
    if (!fs.existsSync(diskPath)) {
        return res.status(404).json({ error: 'Disk not found' });
    }

    const args = [
        '-name', name,
        '-smp', cpu,
        '-m', memory,
        '-hda', diskPath
    ];

    if (iso) {
        const isoPath = path.join(ISO_DIR, iso);
        if (!fs.existsSync(isoPath)) {
            return res.status(404).json({ error: 'ISO not found' });
        }
        args.push('-cdrom', isoPath, '-boot', 'd');
    }

    // Start VM using spawn so we can get its PID
    const qemu = spawn('qemu-system-x86_64', args, {
        detached: true,
        stdio: 'ignore' // prevent it from blocking
    });

    // Detach from parent and let the process live
    qemu.unref();

    const vmConfig = {
        name,
        cpu,
        memory,
        diskName,
        format,
        iso: iso || null,
        pid: qemu.pid,
        startedAt: new Date().toISOString()
    };

    const vmPath = path.join(VM_DIR, `${name}.json`);
    fs.writeFileSync(vmPath, JSON.stringify(vmConfig, null, 2));

    console.log(`✅ VM "${name}" started with PID ${qemu.pid}`);
    res.json({ message: `🖥️ VM "${name}" started successfully`, pid: qemu.pid });
});

// LIST VMs
router.get('/list-vms', (req, res) => {
    const files = fs.readdirSync(VM_DIR).filter(file => file.endsWith('.json'));
    const vmList = files.map(file => {
        const vmData = fs.readFileSync(path.join(VM_DIR, file));
        return JSON.parse(vmData);
    });

    res.json(vmList);
});

// LIST DISKS
router.get('/list-disks', (req, res) => {
    const files = fs.readdirSync(DISK_DIR).filter(file => !file.startsWith('.'));
    const diskInfoList = [];

    for (const file of files) {
        const filePath = path.join(DISK_DIR, file);
        try {
            const output = execSync(`qemu-img info "${filePath}"`).toString();

            const sizeMatch = output.match(/virtual size:.*\((\d+) bytes\)/);
            const formatMatch = output.match(/file format: (\w+)/);
            const preallocMatch = output.match(/preallocation: (\w+)/);
            const subformatMatch = output.match(/subformat: (\w+)/);

            const sizeBytes = sizeMatch ? parseInt(sizeMatch[1]) : 0;
            const sizeGB = Math.round(sizeBytes / (1024 * 1024 * 1024));
            const format = formatMatch ? formatMatch[1] : 'unknown';

            // Infer type
            let type = 'dynamic';
            if (format === 'qcow2') {
                type = preallocMatch ?.[1] === 'full' ? 'fixed' : 'dynamic';
            } else if (format === 'vmdk') {
                type = subformatMatch ?.[1] === 'monolithicFlat' ? 'fixed' : 'dynamic';
            } else if (format === 'raw') {
                type = 'fixed';
            }

            diskInfoList.push({
                name: file.replace(/\.\w+$/, ''), // strip extension
                size: sizeGB.toString(),
                format,
                type
            });

        } catch (err) {
            console.error(`❌ Failed to read info for ${file}:`, err.message);
            // You can choose to skip or push a minimal record
        }
    }

    res.json(diskInfoList);
});

// DELETE VM
router.delete('/delete-vm/:name', (req, res) => {
    const name = req.params.name;
    const vmPath = path.join(VM_DIR, `${name}.json`);

    if (!fs.existsSync(vmPath)) {
        return res.status(404).json({ error: 'VM not found' });
    }

    const { pid } = JSON.parse(fs.readFileSync(vmPath));

    let killed = false;
    try {
        // Check if process exists (this throws if it doesn't)
        process.kill(pid, 0);
        process.kill(pid); // Kill it for real
        killed = true;
    } catch (e) {
        if (e.code !== 'ESRCH') {
            return res.status(500).json({ error: `Failed to stop VM: ${e.message}` });
        }
        console.warn(`⚠️ VM process PID ${pid} already not running.`);
    }

    fs.unlinkSync(vmPath); // remove metadata file

    res.json({
        message: `🗑️ VM "${name}" deleted${killed ? '' : ' (process was already stopped)'}.`
    });
});

// DELETE DISK
router.delete('/delete-disk/:filename', (req, res) => {
    const filename = req.params.filename;
    const diskPath = path.join(DISK_DIR, filename);

    // Check if the disk file exists
    if (!fs.existsSync(diskPath)) {
        return res.status(404).json({ error: `Disk "${filename}" not found.` });
    }

    try {
        fs.unlinkSync(diskPath);
        res.json({ message: `🧹 Disk "${filename}" deleted successfully.` });
    } catch (err) {
        console.error(`❌ Failed to delete disk "${filename}":`, err.message);
        res.status(500).json({ error: `Failed to delete disk: ${err.message}` });
    }
});

// UPDATE DISK
router.put('/update-disk/:filename', (req, res) => {
    const oldFilename = req.params.filename;
    const { name, size } = req.body;

    if (!name && !size) {
        return res.status(400).json({ error: 'You must provide at least a new name or new size.' });
    }

    const oldPath = path.join(DISK_DIR, oldFilename);
    if (!fs.existsSync(oldPath)) {
        return res.status(404).json({ error: `Disk "${oldFilename}" not found.` });
    }

    const ext = path.extname(oldFilename).replace('.', '').toLowerCase();
    const currentName = path.basename(oldFilename, `.${ext}`);
    const newFilename = `${name || currentName}.${ext}`;
    const newPath = path.join(DISK_DIR, newFilename);

    // Step 1: Rename if needed
    if (name && newFilename !== oldFilename) {
        try {
            if (fs.existsSync(newPath)) {
                return res.status(409).json({ error: `A disk named "${newFilename}" already exists.` });
            }
            fs.renameSync(oldPath, newPath);
        } catch (err) {
            return res.status(500).json({ error: `Failed to rename disk: ${err.message}` });
        }
    }

    // Step 2: Resize if needed
    if (size) {
        if (!RESIZE_SUPPORTED_FORMATS.includes(ext)) {
            return res.status(400).json({
                error: `Resize not supported for format "${ext}". Supported formats: ${RESIZE_SUPPORTED_FORMATS.join(', ')}`
            });
        }

        try {
            const output = execSync(`qemu-img info "${newPath}"`).toString();
            const sizeMatch = output.match(/virtual size:.*\((\d+) bytes\)/);
            const currentSizeBytes = sizeMatch ? parseInt(sizeMatch[1]) : 0;
            const currentSizeGB = Math.ceil(currentSizeBytes / (1024 * 1024 * 1024));
            const requestedSize = parseInt(size);

            if (requestedSize > currentSizeGB) {
                execSync(`qemu-img resize "${newPath}" ${requestedSize}G`);
                return res.json({
                    message: `✅ Disk "${newFilename}" resized from ${currentSizeGB}G to ${requestedSize}G.`
                });
            } else if (!name) {
                return res.status(400).json({
                    error: `New size must be greater than current size (${currentSizeGB}G).`
                });
            }
        } catch (err) {
            return res.status(500).json({ error: `Failed to resize disk: ${err.message}` });
        }
    }

    res.json({ message: `✅ Disk "${oldFilename}" successfully renamed to "${newFilename}".` });
});

export default router;
