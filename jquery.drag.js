/*!
 * Addon for jQuery library - allowing to drag elements.
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
	var isMouseDown = false; // Состояние нажатия курсора
	var isMouseMove = false; // Состояние перемещения курсора

	// Элемент который мы движем
	var current = null;
	var $current = null;

	// Позиции объекта
	var lastMouseX;
	var lastMouseY;
	var lastElemTop;
	var lastElemLeft;
	var relativeX;
	var relativeY;

	// Статус перетаскиваемого объекта
	var dragObject = { };
	var moveCount = 0;

	// Устанавливаем елемент - как двигаемый - allowBubbling включае/отключает event bubbling
	$.fn.draggable = function( allowBubbling, draggedArea, holder )
	{
		var draggedArea = draggedArea;

		this.each( function( )
		{
			// Если не установлен идентификатор - устанавливаем
			if( this.id === undefined || this.id === '' )
			{
				 this.id = 'drag' + ( new Date( ).getTime( ) );
			}

			dragObject[ this.id ] = dragObject[ this.id ] || {};
			dragObject[ this.id ].status = 'on'; // Устанавалием статус drag`а
			dragObject[ this.id ].holder = holder; // Устанавливаем того "в ком мы находимся"

			// Обработка нажатия клавиши мышки
			$( this ).mousedown( function( event )
			{
				// Если нажата не левая клавиша, или был клик по input - ничего не делаем
				if( event.which !== 1
						|| $( event.target ).is( 'input' ) || $( event.target ).is( 'select' )
							|| $( event.target ).attr( 'editable' ) )
				{
					return;
				}

				// Делаем это действием по умолчанию
				event.preventDefault( );

				// Обновление статусов
				isMouseDown = true;

				current = this; // HTML
				$current = ( draggedArea ) ? draggedArea : $( current ); // jquery обьект

				return allowBubbling;
			} );
		} );

		return this;
	};

	// Выключаем возможность перемещения
	$.fn.dragOff = function( )
	{
		return this.each( function( )
		{
			if( dragObject[ this.id ] !== undefined )
			{
				dragObject[ this.id ].status = 'off';
			}
		} );
	};

	// Включаем возможность перемещения
	$.fn.dragOn = function( )
	{
		return this.each( function( )
		{
			if( dragObject[ this.id ] !== undefined )
			{
				dragObject[ this.id ].status = 'on';
			}
		} );
	};

	// Узнаём состояние перемещения
	$.fn.dragStatus = function( )
	{
		var statuses = [];

		this.each( function( )
		{
			var obj = dragObject[ this.id ];
			statuses.push( ( obj !== undefined && obj.status !== undefined ) ? obj.status : -1 );
		} );

		return statuses;
	};

	// Позиция курсора
	$.getMousePosition = function( event )
	{
		var pos = { x: 0, y: 0, relativeX: 0, relativeY: 0 };

		if( !event )
		{
			var event = window.event;
		}

		if( event.pageX || event.pageY )
		{
			pos.x = event.pageX;
			pos.y = event.pageY;
		}
		else if( event.navigatorX || event.navigatorY )
		{
			pos.x = event.navigatorX + document.body.scrollLeft + document.documentElement.scrollLeft;
			pos.y = event.navigatorY + document.body.scrollTop  + document.documentElement.scrollTop;
		}

		return pos;
	};

	// Обновляем позицию
	$.updatePosition = function( event, modifyPos )
	{
		var pos = $.getMousePosition( event );
		var modifyPos = ( modifyPos === undefined ) ? $.extend( true, { }, pos ) : modifyPos;

		var position = { left: ( modifyPos.x !== pos.x ) ? modifyPos.x : pos.x - lastMouseX + lastElemLeft,
						top: ( modifyPos.y !== pos.y ) ? modifyPos.y : pos.y - lastMouseY + lastElemTop };

		$current.positionScaled( position );

		return position;
	};

	// Мыш "отжата"
	$( document ).mouseup( function( event )
	{
		if( !current ){ return; }
		var object = dragObject[ current.id ];

		if( isMouseDown && $current && object && object.status === 'on' )
		{
			var allowBubbling = true;

			// Вызов колбека отпускания мыши
			if( isMouseMove )
			{
				$( current ).trigger( 'dragend' );
				allowBubbling = false;

				// Проверяем не вышли ли мы за рамки родителя
				if( object.holder !== undefined )
				{
					$current.removeClass( 'throwOut' );

					if( current.isOut )
					{
						$( current ).trigger( 'dragout' );
					}
				}
			}

			isMouseDown = false;
			isMouseMove = false;
			moveCount = 0;

			current = null;
			$current = null;

			return allowBubbling;
		}
	} );

	// Обрабатываем движение курсора
	$( document ).mousemove( function( event )
	{
		if( !current ){ return; }
		var object = dragObject[ current.id ];

		// Если мышка "нажата" и статус drag`а = on - обновляем позицию
		if( isMouseDown && object && object.status === 'on' )
		{
			if( moveCount < 1 )
			{
				moveCount++;
				return false;
			}
			// Если уже одно движение мышкой после нажатия было - считаем что это начало Drag`а
			else if( moveCount === 1 )
			{
				event.preventDefault( );

				// Смотрим где была нажата мыша
				var pos = $.getMousePosition( event );
				lastMouseX = pos.x;
				lastMouseY = pos.y;

				var cssPosition = $current.css( 'position' );
				var position = $current.positionScaled( );

				/* Закомментировано ввиду непонимания предназначения
				 * @toRefact: Но по идее этот функционал можно продумать и сделать в случае relative и static - ограничение перемещения - только в родителе */
				//lastElemTop  = ( cssPosition == 'relative' || cssPosition == 'static' ) ? 0 : position.top;
				//lastElemLeft = ( cssPosition == 'relative' || cssPosition == 'static' ) ? 0 : position.left;

				lastElemTop = position.top;
				lastElemLeft = position.left;

				// Расположение курсора относительно объекта по которому произошёл клик
				relativeX = ( pos.x - $( current ).offset( ).left );
				relativeY = ( pos.y - $( current ).offset( ).top );
				pos.relativeX = relativeX;
				pos.relativeY = relativeY;

				// Вызов колбека начала
				$( current ).trigger( 'dragstart', pos );

				moveCount++;
				return false;
			}
			else
			{
				// Устанавливаем флаг - "курсор в движении"
				isMouseMove = true;
				event.preventDefault( );

				var pos = $.getMousePosition( event );
					pos.relativeX = relativeX;
					pos.relativeY = relativeY;

				// Копируем значение позиции
				var modifyPos = $.extend( true, { }, pos );

				// Вызов колбека перед передвижения, для обработки возможной модификации маршрута
				var modifyPos = $( current ).triggerHandler( 'drag', modifyPos );

				// Проверяем не вышли ли мы за рамки родителя
				if( object.holder !== undefined )
				{
					$( current ).checkDraggedOut( );
				}

				// Если не было модификация драга
				if( modifyPos === undefined || ( modifyPos.x === pos.x && modifyPos.y === pos.y  ) )
				{
					$.updatePosition( event ); // Обновление позиции
				}
				else
				{
					$.updatePosition( event, modifyPos ); // Обновление позиции с модифицированным значением
				}
			}
		};
	} );

	// Область покинула пределы хранителя?
	$.fn.checkDraggedOut = function( )
	{
		var object = dragObject[ current.id ];
		if( object === undefined || object.holder === undefined ) { return; }

		var holder = object.holder;
		var areaCoords = $current.positionScaled( );
		var holderCoords = holder.$.positionScaled( );
		var height = areaCoords.bottom - areaCoords.top;
		var width = areaCoords.right - areaCoords.left;
		var stretch = Math.floor( ( ( height > width ) ? width : height ) * 0.3 ); // Роль переменной: дать общее допустимое расстояние, на которое область может покидать контейнер, не будучи выброшеной за его пределы

		// Вышла ли область за пределы хранителя
		if ( areaCoords.left < holderCoords.left - stretch ||   // Вышла слева
			areaCoords.top < holderCoords.top - stretch ||		// Вышла сверху
			areaCoords.right > holderCoords.right + stretch ||  // Вышла справа
			areaCoords.bottom > holderCoords.bottom + stretch ) // Вышла снизу
		// Область покинула пределы хранителя
		{
			$current.addClass( 'throwOut' );
			current.isOut = true;
		}
		else
		// Область остаётся в пределах хранителя
		{
			$current.removeClass( 'throwOut' );
			current.isOut = false;
		}

		return current.isOut;
	};

} )( jQuery );
