%%%=============================================================================
%%% @author Rodrigo Cacilhας <batalema@cacilhas.info>
%%%         [http://cacilhas.info/kodumaro/]
%%% @copyright ©2016, Rodrigo Cacilhας
%%% @end
%%%=============================================================================
-module(mh_guest).
-author('batalema@cacilhas.info').
-export([choose/0, change/2]).

-include("mh.hrl").

-spec choose() -> door().
-spec change(Original :: door(), Alternative :: door()) -> door().


%%%=============================================================================
choose() -> lists:nth(random:uniform(3), [a, b, c]).


change(Original, Alternative) ->
	case ?CHANGE of
		yes -> Alternative;
		_ -> Original
	end.
