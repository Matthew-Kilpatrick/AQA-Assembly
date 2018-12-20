# AQA Assembly Web

### Introduction
This website was developed to provide an interface to allow users to enter assembly code from the [AQA assembly code instruction set](https://filestore.aqa.org.uk/resources/computing/AQA-75162-75172-ALI.PDF). The site uses JavaScript to process the assembly code inputted by the user, and allows the program to either be run immediately via  a 'run' button; to be manually stepped through each step (for trying to understand how the code is working), or via an auto-step functionality, which allows the user to enter the interval between each line execution.  

The site displays the values of registers (R0 - R12), as well as any populated memory locations, and the status of command operators. Any changes made in the current command execution in registers, memory, or comparisons are highlighted in green, in addition to the line currently being executed.  

The site includes a few example assembly language programs, such as integer division and multiplication, which are accessible via the 'View examples' link in the site footer.

### Usage
You may either download this repository and run it from a web server or locally (there is no server-side code for this project), or you may access the project at [https://matthewkilpatrick.uk/aqa-assembly](https://matthewkilpatrick.uk/aqa-assembly). 

### Credits
The following open source libraries have been used in this project.  
[ACE Editor](https://github.com/ajaxorg/ace)  
[Bootstrap 4](https://github.com/twbs/bootstrap)  
[jQuery](https://github.com/jquery/jquery)  
[Popper.js](https://github.com/FezVrasta/popper.js)  

### License
This program is licensed under under a [MIT license](https://github.com/Matthew-Kilpatrick/AQA-Assembly-Web/blob/master/LICENSE): this means you are able to make modifications to the code, and use it commercially. Please view the license for full details.
