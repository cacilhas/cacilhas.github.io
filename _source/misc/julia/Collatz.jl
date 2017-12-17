module Collatz

    import Base.SizeUnknown,
           Base.done,
           Base.iteratorsize,
           Base.next,
           Base.start
    export collatz

    struct Iter
        value::UInt
        Iter(value::UInt) = (value ≡ zero(value)) ?
        throw(InexactError()) : new(value)
        Iter(value::Integer) = value |> UInt |> Iter
    end

    #=
    = API
    =#

    collatz(value::Integer) = Iter(value)

    #=
    = Iteration interface
    =#

    iteratorsize(::Iter) = SizeUnknown()
    start(::Iter) = nothing
    done(::Iter, ::Void) = false
    done(::Iter, state::UInt) = state ≡ one(state)
    next(iter::Iter, ::Void) = (iter.value, iter.value)
    next(::Iter, state::UInt) = state |> nextstep |> v -> (v, v)

    nextstep(value::UInt) = (value % 2) ≡ zero(value) ? value ÷ 2 : 3value + 1

end
