<?php
error_reporting(E_ALL);
ini_set('display_errors',1);
class Products {
	private static $instance;
	private static $mysqli_conn;
	
	public function __construct() {
	}
	
	public static function get_products() {
		header("Content-Type: application/json; charset=UTF-8");
		$posted = file_get_contents("php://input");
		if (!$posted || !($obj = json_decode($posted, false)) || ($obj->start_from ?? '')==='' || !is_numeric($obj->start_from)) {
			die(json_encode(['error'=>'wrong params']));
		}
		$order_by = null;
		if (($obj->order_by ?? '')!='') {
			switch ($obj->order_by) {
				case 'ther_sorting_byprice':
					$order_by = 'price';
				break;
				case 'ther_sorting_byreview':
					$order_by = 'reviews';
				break;
				case 'ther_sorting_byname':
					$order_by = '`name`';
				break;
				case 'ther_sorting_bysaving':
					$order_by = 'was_price-price';
				break;
			}
		}
		$res = self::get_mysqli_conn()->prepare("SELECT name,price,was_price,reviews,img FROM products".($order_by ? ' ORDER BY '.$order_by : '')." LIMIT ?,12");
		$res->bind_param("i", $obj->start_from);
		$res->execute();
		$products = $res->get_result()->fetch_all(MYSQLI_ASSOC);
		$next_batch_count = 0;
		if (count($products)==12) {
			$res = self::get_mysqli_conn()->prepare("SELECT COUNT(product_id) as countt FROM products");
			$res->execute();
			$next_batch_count=($next_batch_count=($res->get_result()->fetch_column() - $obj->start_from)) > 12 ? 12 : ($next_batch_count < 0 ? 0 : $next_batch_count);
		}
		$res->close();
		die(json_encode(['next_batch_count'=>$next_batch_count,'product_arr'=>$products]));
	}
	
	public static function handle_compatibility_version($version):void {
		if ($version == '1.0.0') {
			$mysqli=self::get_mysqli_conn();
			$sql = "CREATE TABLE IF NOT EXISTS products(
				product_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
				name VARCHAR(255) NOT NULL,
				price DECIMAL(6,2) NOT NULL,
				was_price DECIMAL(6,2) DEFAULT NULL,
				reviews TINYINT UNSIGNED DEFAULT NULL,
				img INT UNSIGNED DEFAULT NULL,
				PRIMARY KEY (product_id)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8;";
			if (!$mysqli->query($sql) || $mysqli->errno) {
			   printf("Could not create table: %s", $mysqli->error);exit;
			}
			$mysqli->close();
		}
	}
	public static function populate_products():void {
		$mysqli=self::get_mysqli_conn();
		$img_id=0;
		$prepared = $mysqli->prepare("INSERT INTO products (name,price,was_price,reviews,img) VALUES (?,?,?,?,?)");
		if($prepared==false) die('$prepared failed - '.$i);
		for ($i=1;$i<=5000;$i++) {
			$img_id++;
			$name = "Product $i";
			$price = $i+($i%3==0 ? 0.99 : 0);
			$was_price = $i%2==0 ? $i+mt_rand(1,5) : null;
			$reviews = $i%2!=0 ? mt_rand(1,99) : null;
			$result=$prepared->bind_param("sddii",$name,$price,$was_price,$reviews,$img_id);
			if($result==false) die('bind_param failed - '.$i);
			
			$result=$prepared->execute();
			if($result==false) die('execute failed - '.$i);
			$prepared->close();
			if ($img_id==12) $img_id=0;
		}
		$mysqli->close();
		die('done');
	}
	
	/** mysqli_conn instance */
	private static function get_mysqli_conn():mysqli {
		if ( ! isset( self::$mysqli_conn ) ) {
			self::$mysqli_conn = new mysqli("localhost", "root", "", "the_range_ecommerce");
			if(self::$mysqli_conn->connect_errno ) {
				printf("mysqli connection failed: %s", self::$mysqli_conn->connect_error);exit;
			 }
		}
		return self::$mysqli_conn;
	}
	/** Singleton instance */
	public static function get_instance():self {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}
	
}
//Products::handle_compatibility_version('1.0.0');
//Products::populate_products();
Products::get_products();