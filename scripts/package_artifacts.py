"""Package extension and Agent Skills independently, without local user data."""
import argparse
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

EXCLUDED_DIRS = {'.git', '.codex', '.claude', '.gemini', 'node_modules', 'out', 'dist', '__pycache__', 'profile', 'profiles', 'edge-profile'}
EXCLUDED_FILES = {'config.json', 'Cookies', 'Login Data', 'Local State', '.DS_Store', 'Thumbs.db'}

def package(repo: Path, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    archives = []
    for kind, marker in [('chrome-extensions', 'manifest.json'), ('skills', 'SKILL.md')]:
        for folder in sorted((repo / kind).glob('*')):
            if not folder.is_dir() or not (folder / marker).is_file():
                continue
            prefix = 'skill-' if kind == 'skills' else ''
            dest = output / f'{prefix}{folder.name}.zip'
            with ZipFile(dest, 'w', ZIP_DEFLATED) as zipfile:
                for file in sorted(folder.rglob('*')):
                    relative = file.relative_to(folder)
                    if file.is_symlink() or not file.is_file():
                        continue
                    if any(p in EXCLUDED_DIRS for p in relative.parts) or file.name in EXCLUDED_FILES:
                        continue
                    if file.suffix in {'.log', '.pyc'} or file.name.startswith('.env'):
                        continue
                    name = Path(folder.name) / relative if kind == 'skills' else relative
                    zipfile.write(file, name.as_posix())
            archives.append(dest)
    return archives

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    for archive in package(args.repo, args.output or args.repo / 'dist'):
        print(archive)
