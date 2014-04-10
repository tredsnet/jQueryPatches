/*!
 * Click-separation patch for jQuery library.
 * https://github.com/tredsnet/jQueryPatches
 * http://treds.net
 *
 * Developers:
 * Brataschuk V.
 * Borisenko V.
 *
 * Released under the MIT license
 *
 * Date: 10.04.2014
 */
 
(function( $ )
{
	var timeOut = 200; // Время ожидания
	var start = { x: 0, y: 0 }; // Точка начала
	var end = { x: 0, y: 0 }; // Точка конца
	var distance = 0; // Расстояние между началом и концом движения
	var maxDistance = 3;

	var onMethod = $.fn.on; // Записываем оригинальный on
	var offMethod = $.fn.off; // Записываем оригинальный off

	var singleDoubleClick = function( event )
	{
		// Для каждого объекта в цепи, по которой от сына отцу идет событие, нужно создать свой таймер и счетчик кликов
		// то есть один глобальный объект нельзя держать, если два сына, то клик стает дабл кликом
		event.currentTarget.clicks = ( event.currentTarget.clicks || 0 ) + 1;
		var timeoutCallback = function( event )
		{
			return function( )
			{
				// Учитываем кол-во кликов, дергание мыши и стопинг пропагации
				if( event.currentTarget.clicks === 1 && distance < maxDistance && ( !event.originalEvent || !event.originalEvent.cancelBubble ) )
				{
					$( event.currentTarget ).trigger( 'regclick', [event] );
				}
				else if( event.currentTarget.clicks > 1 && distance < maxDistance && ( !event.originalEvent || !event.originalEvent.cancelBubble ) )
				{
					$( event.currentTarget ).trigger( 'regdblclick', [event] );
				}
				event.currentTarget.clicks = 0;
				clearTimeout( event.currentTarget.timer );
			};
		};

		// Устанавливаем таймер
		event.currentTarget.timer = setTimeout( timeoutCallback( event ), timeOut || 250 );
	};

	// Начало движения
	var startMoving = function( event )
	{
		start = $.getMousePosition( event );
	};

	// Конец движения
	var endMoving = function( event )
	{
		end = $.getMousePosition( event );
		var dx = end.x - start.x;
		var dy = end.y - start.y;
		distance = Math.sqrt( dx * dx + dy * dy );
	};

	// Регистрация на click event
	$.fn.click = function( eventData, eventFunc )
	{
		return this.on( 'click', eventData, null, eventFunc );
	};

	// Регистрация на dblclick event
	$.fn.dblclick = function( eventData, eventFunc )
	{
		return this.on( 'dblclick', eventData, null, eventFunc );
	};

	$.fn.on = function( ) // ( types, selector, data, fn, one )
	{
		var eventType = arguments[0];

		if( typeof eventType === 'object' // ( types-Object, selector, data )
				|| ( typeof eventType === 'string' && eventType.indexOf( ' ' ) > -1 ) ) // types = "click mousemove etc..."
		{
			if( typeof arguments[1] !== 'string' ) // && selector != null
			{
				// ( types-Object, data )
				arguments[2] = arguments[2] || arguments[1];
				arguments[1] = undefined;
			}

			// Вызываем одиночные ON
			if( typeof eventType === 'object' ) // Список действий в объекте
			{
				for( var type in arguments[0] )
				{
					this.on( type, arguments[1], arguments[2], arguments[0][ type ], arguments[4] );
				}
			}
			else // Список действий в строке через пробел
			{
				var eventTypes = eventType.split( ' ' );

				for( var i in eventTypes )
				{
					this.on( eventTypes[i], arguments[1], arguments[2], arguments[3], arguments[4] );
				}
			}
		}
		else
		{
			switch( true )
			{
				case eventType === 'click' || eventType === 'dblclick':
				{
					var eventFunc = undefined;
					var eventSelector = undefined;
					var eventData = undefined;

					if( ( arguments[2] === null || typeof arguments[2] === 'undefined' )
							&& ( arguments[3] === null || typeof arguments[3] === 'undefined' )  ) // ( types, fn )
					{
						eventFunc = arguments[1];
						eventData = eventSelector = undefined;
					}
					else if( arguments[3] === null || typeof arguments[3] === 'undefined' )
					{
						if( typeof arguments[1] === 'string' ) // ( types, selector, fn )
						{
							eventFunc = arguments[2];
							eventData = undefined;
						}
						else // ( types, data, fn )
						{
							eventFunc = arguments[2];
							eventData = arguments[3];
							eventSelector = undefined;
						}
					}

					// Инициируем навешивание текущей функции с дополнительными обработками
					onMethod.call
					(
						this,
						'reg' + eventType,
						eventSelector,
						eventData,
						function( regEvent, event )
						{
							// Важная проверка, чтобы знать мы ли это в цепи передачи событий
							if( this === regEvent.target )
							{
								regEvent.stopPropagation( );
								eventFunc.call( regEvent.target, event );
							}
						}
					);

					//
					var clickEvents = $._data( this[0], 'events' ) ? $._data( this[0], 'events' )[ 'click' ] : undefined;

					// Если еще не записали ни одного клика - записываем
					if( typeof clickEvents === 'undefined' )
					{
						onMethod.call( this, 'click', eventSelector, eventData, singleDoubleClick );

						// Для проверки дергания мыши
						onMethod.call( this, 'mousedown', eventSelector, eventData, startMoving );
						onMethod.call( this, 'mouseup', eventSelector, eventData, endMoving );
					}

					break;
				}
				default:
				{
					onMethod.apply( this, arguments ); // Вызов on без изменений
				}
			}
		}

		return this;
	};

	// Наш обработчик снятия навешивания
	$.fn.off = function( ) //( types, selector, fn )
	{
		var eventType = arguments[0];

		if( typeof eventType === 'object' // ( types-Object, selector, data )
				|| ( typeof eventType === 'string' && eventType.indexOf( ' ' ) > -1 ) ) // types = "click mousemove etc..."
		{
			// Вызываем одиночные OFF
			if( typeof eventType === 'object' ) // Список действий в объекте
			{
				for( var type in arguments[0] )
				{
					this.off( type, arguments[1], arguments[0][ type ] );
				}
			}
			else // Список действий в строке через пробел
			{
				var eventTypes = eventType.split( ' ' );

				for( var i in eventTypes )
				{
					this.off( eventTypes[i], arguments[1], arguments[2] );
				}
			}
		}
		else
		{
			switch( true )
			{
				case eventType === 'click' || eventType === 'dblclick':
				{
					if ( arguments[1] === false || typeof arguments[1] === "function" ) // ( types [, fn] )
					{
						arguments[2] = arguments[1];
						arguments[1] = undefined;
					}

					var eventFunc = undefined;
					var eventSelector = undefined;

					offMethod.call( this, 'click', singleDoubleClick );
					offMethod.call( this, 'mousedown', startMoving );
					offMethod.call( this, 'mouseup', endMoving );
					offMethod.call( this, 'reg' + eventType ); // @toRefact: Здесь нужно сделать отвязку от КОНКРЕТНОЙ ФУНКЦИИ ( сейчас же отвязка идёт ОТ ВСЕХ навешеных функций )

					break;
				}
				default:
				{
					offMethod.apply( this, arguments ); // Вызов стандартного off
				}
			}
		}

		return this;
	};
})( jQuery );
