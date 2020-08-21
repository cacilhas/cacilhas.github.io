[bpython]: https://www.bpython-interpreter.org/
[cython]: https://cython.org/
[datalog]: http://datalog.sourceforge.net/
[fibonacci]: https://www.cs.utexas.edu/users/EWD/ewd06xx/EWD654.PDF
[kodumaro]: https://kodumaro.cacilhas.info/2020/08/fibonacci.html
[matrix]: https://math.stackexchange.com/questions/61997/proof-of-this-result-related-to-fibonacci-numbers-beginpmatrix11-10-end
[numpy]: https://numpy.org/
[prolog]: https://www.swi-prolog.org/
[pydatalog]: https://pypi.org/project/pyDatalog/
[venv]: https://docs.python.org/3/library/venv.html

From [Kodumaro][kodumaro].

One of the most interesting algorithms is the [Fibonacci numbers][fibonacci]. It’s pretty tricky ’cause it might leads to a binary tree recursion if coded carelessly.

There’s a lot of ways to go around that issue, and I’d like to approach two of them using [Cython][cython].

### Accumulators and tail-call optimisation

[Prolog][prolog] is a declarative logic programming language, consisting of describing the factual domain and then querying it.

The simpliest (and **wrong**) way to code Fibonacci in Prolog is:

```prolog
% vim: filetype=prolog
:- module(fib, [fib/2]).

fib(N, R) :- % step
  N > 0,
  N1 is N - 1,
  N2 is N - 2,
  fib(N1, R1),
  fib(N2, R2),
  R is R1 + R2.

fib(0, 1). % stop
```

This describes Fibonacci number precisely, but **don’t do it**. It dives into a binary tree, doubling the stack every step.

The way to fix it is using two accumulators, `A` and `B`:

```prolog
% vim: filetype=prolog
:- module(fib, [fib/2]).

fib(N, R) :- N >= 0, fib(N, 0, 1, R).

fib(N, A, B, R) :- % step
  N > 0,
  N1 is N - 1,
  AB is A + B,
  fib(N1, B, AB, R).

fib(0, A, R, R). % stop
```

Now it accumulates the values lineraly until the stop condition, when the last `B` is bound to `R`.

Try it:

```
?- [fib].
true.

?- findall(X, (between(0, 5, I), fib(I, X)), R).
R = [1, 1, 2, 3, 5, 8].

?-
```

Prolog was used as basis for another programming language called [Datalog][datalog], focused on database query.

The whole thing becomes simplier when Datalog comes into play. Let’s see the same domain coded in Datalog:

```datalog
fib(0, A, B, R) :- B = R.
fib(N, A, B, R) :- N > 0, fib(N-1, B, A+B, R).
fib(N, R) :- N >= 0, fib(N, 0, 1, R).
```

And then:

```
> between(0, 5, I), fib(I, X)?
fib(0, 1).
fib(1, 1).
fib(2, 2).
fib(3, 3).
fib(4, 5).
fib(5, 8).
>
```

### Enter pyDatalog

Python has a Datalog bind egg called [pyDatalog][pydatalog], installed by a simple `pip`:

```
python3.8 -mpip install pyDatalog
```

You can use a [virtual environment][venv], or install directly into your system as root – your choice.

We’re gonna need Cython too:

```
python3.8 -mpip install cython
```

In order to do some Datalog inside Python/Cython code, we need to declare the Datalog terms we’re using.

This below is the very same Datalog code, using a `cpdef` to expose the `fib/2`:

```cython
#cython: language_level=3
from libc.stdint cimport uint64_t
from pyDatalog.pyParser import Term

cdef:
    object _fib = Term()
    object A = Term()
    object B = Term()
    object R = Term()
    object N = Term()
    object X = Term()

_fib(0, A, B, R) <= (R == B)
_fib(N, A, B, R) <= (N > 0) & _fib(N-1, B, A+B, R)

cpdef uint64_t fib(size_t n) except -1:
    _fib(n, 0, 1, X)
    return X.v()
```

Now we need to compile it. Save it as fib.pyx and run:

```
cythonize fib.pyx
clang `python3.8-config --cflags` -fPIC -c fib.c
clang -o fib.so `python3.8-config --libs` -shared fib.o
```

(Or use `gcc`.)

It’s time to see it working. Open the [`bpython`][bpython]:

```
>>> from fib import fib
>>> [fib(i) for i in range(5)]
[1, 1, 2, 3, 5, 8]
>>>
```

### Using matrices

The Fibonacci numbers can also be represented as a [matrix power][matrix]:

```
│1 1│ⁿ
│1 0│
```

That’s a very elegant approach. We can do it by using [NumPy][numpy]. First let’s install the egg just like before:

```
python3.8 -mpip install numpy
```

Now let’s recode Fibonacci using matrices:

```cython
#cython: language_level=3
from libc.stdint cimport uint64_t
from numpy cimport ndarray
from numpy import matrix, uint64

cdef:
    ndarray m = matrix('1, 1; 1, 0', dtype=uint64)

cpdef uint64_t fib(size_t n) except -1:
    return (m ** n)[0, 0]
```

NumPy represents the Fibonacci matrix as `'1, 1; 1, 0'`. You can compile the code exactly the same way you did before, with the same results.
