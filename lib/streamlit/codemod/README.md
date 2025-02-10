# Codemod Runner

This directory contains a codemod runner and the codemod scripts for applying
transformations to Python code. Codemods are automated code modifications that
can be used to refactor code, add new parameters, or update function calls
across a codebase.

## Overview

The codemod runner allows you to apply a specified codemod to all Python files
in a directory or a single file. The codemod is a Python module that defines a
`transform_file` function, which takes the source code of a file as input and
returns the modified source code.

## Usage

To use the codemod runner, you need to specify the codemod module and the path
to the directory or file you want to process. The codemod module should be
located in the `streamlit.codemod.scripts` package.

### Example

Suppose you have a codemod module named `add_flex_param` that adds a `flex`
parameter to certain functions. You can apply this codemod to all Python files
in the `../elements` directory with the following command:

```bash
python -m streamlit.codemod.runner add_flex_param ../elements
```

### Codemod Module Structure

A codemod module should define a `transform_file` function that takes a string
(the source code) as input and returns a string (the modified source code). Here
is an example structure of a codemod module:

```python
# filepath: /Users/bnisco/src/streamlit/lib/streamlit/codemod/scripts/add_flex_param.py
import libcst as cst
from libcst.metadata import MetadataWrapper

def transform_file(source_code: str) -> str:
    source_tree = cst.parse_module(source_code)
    wrapper = MetadataWrapper(source_tree)

    # Perform transformations on the source_tree
    # ...

    return source_tree.code
```

### Running the Codemod Runner

To run the codemod runner, use the following command:

```bash
python -m streamlit.codemod.runner <codemod_module> <path>
```

Replace `<codemod_module>` with the name of your codemod module (e.g.,
`add_flex_param`) and `<path>` with the path to the directory or file you want
to process.

### Example Output

When you run the codemod runner, it will process each file and print messages
indicating whether changes were made:

```
Modified: /path/to/file1.py
No changes needed: /path/to/file2.py
Error processing /path/to/file3.py: <error message>
```
