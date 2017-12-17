#!/usr/bin/env julia

include("Collatz.jl")

module CollatzTest

    using Base.Test
    import Collatz
    using Collatz: collatz

    @testset "Collatz.Iter" begin
        @testset "should return iterator" begin
            iter = @inferred collatz(4)
            @test isa(iter, Collatz.Iter)
            @test iter.value == 4
        end

    end

    @testset "collatz tests" begin
        @testset "should be iterable" begin
            @test [n for n in collatz(5)] == [5, 16, 8, 4, 2, 1]
        end

        @testset "should fail on zero" begin
            @test_throws InexactError collatz(0)
        end

        @testset "should fail on negative integer" begin
            @test_throws InexactError collatz(-1)
        end

        @testset "should fail on non integer" begin
            @test_throws MethodError collatz(1.0)
        end
    end
end
